var steamServerStatus = require('steam-server-status');
var dgram = require('dgram');
var net = require('net');
var BufferBuilder = require('buffer-builder');
var _ = require('lodash');
var Q = require('Q');
var restler = require('restler');
var fs = require('fs');
var MAXPAGES = 50;

CONFIG_JSON = {};
try {
  CONFIG_JSON = JSON.parse(fs.readFileSync('config.json'));
} catch (e) {
  console.error("Couldn't parse config.json: ", e);
}

var sendSingleQuery = function(socket, prevIP, prevPort, queryStr){
  var buf = new BufferBuilder();
  var queryPageServer = prevIP + ":" + prevPort;
  console.log("QueryPageServer: " + queryPageServer)
  buf.appendUInt8(0x31);
  buf.appendUInt8(0xFF);
  buf.appendString(queryPageServer);
  buf.appendUInt8(0);
  buf.appendString(queryStr);
  buf.appendUInt8(0);

  var cb = function(err){
    if (err != null) {
      console.error("Some error occurred: ", err);
    }
  }

  socket.send(buf.get(), 0, buf.length, 27011, "hl2master.steampowered.com", cb);
}

var sendQuery = function(queryStr, callback) {
  var i = 0;
  var socket;
  socket = dgram.createSocket('udp4');

  var servers = [];

  var done = function(receivedServers) {
    console.log("Done fetching server list! Receiving server details...");
    // Filter 0.0.0.0:0 out of received server list first:
    receivedServers = _.filter(receivedServers, function(receivedServer){
      return receivedServer.ip != "0.0.0.0";
    })
    // Setup array of promises
    var promises = _.map(receivedServers, function(receivedServer) {
      var deferred = Q.defer();
      console.log("Getting details for server " + receivedServer.ip + ":" + receivedServer.port);
      steamServerStatus.getServerStatus(receivedServer.ip, receivedServer.port, function(serverInfo) {
        if (serverInfo.error) {
          deferred.reject(serverInfo.error);
        } else {
          deferred.resolve(serverInfo);
        }
      });
      return deferred.promise;
    });
    // Query all servers and wait until they're all settled...
    Q.allSettled(promises).then(function(results) {
      var fulfilledPromises = _.filter(results, function(result) {
        return result.state === "fulfilled";
      });
      var fulfilledResults = _.pluck(fulfilledPromises, 'value');
      var numberOfPlayers = _.reduce(fulfilledResults, function(memo, result) {
        return memo + result.numberOfPlayers;
      }, 0);
      if (callback !== undefined) {
        callback(fulfilledResults, numberOfPlayers);
      }
    });
  }

  socket.on('message', function(msg, rinfo) {
    i++;
    var receivedServers = parseResponse(msg);
    var lastServer = receivedServers[receivedServers.length-1];
    if (receivedServers != null && lastServer.ip != "0.0.0.0" && lastServer.port != 0) {
      if (i < MAXPAGES) {
        sendSingleQuery(socket, lastServer.ip, lastServer.port, queryStr);
      } else {
        console.warn("too many pages received from Valve masterserver; stopping!")
      }
    } else {
      done(receivedServers);
    }
  });
  sendSingleQuery(socket, "0.0.0.0", "0", queryStr);
}

var parseResponse = function(buf) {
  // todo: validate first 6 bytes:  FF FF FF FF 66 0A
  var getIPPort = function(buf, offset) {
    var o1 = buf.readUInt8(offset+0);
    var o2 = buf.readUInt8(offset+1);
    var o3 = buf.readUInt8(offset+2);
    var o4 = buf.readUInt8(offset+3);
    var port = buf.readUInt16BE(offset+4);
    return {
      "ip": o1 + "." + o2 + "." + o3 + "." + o4,
      "port": port
    };
  }
  var lastoffset = buf.length;
  var retval = [];
  for (var offset = 6; offset < lastoffset; offset+=6) {
    var ipport = getIPPort(buf, offset);
    retval.push(ipport);
  }
  return retval;
}

sendQuery("\\appid\\244630", function(results, numberOfPlayers) {
  console.log("Number of Neotokyo players: " + numberOfPlayers);
  if (CONFIG_JSON.hasOwnProperty("phant-post")) {
    console.log("Submitting to Phant...");
    restler.post(CONFIG_JSON["phant-post"]["post-url"], {
      "data": {
        numplayers: "" + numberOfPlayers
      },
      "headers": {
        'Phant-Private-Key': CONFIG_JSON["phant-post"]["private-key"]
      }
    }).on('complete', function(data, response){
      console.log("Request sent. Response code: " + response.statusCode);
    });
  }
});
