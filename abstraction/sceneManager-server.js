// Copyright 2016 Intel Corporation
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const device = require("iotivity-node");
const server = device.server;
const client = device.client;

var sceneResource, fidoResource,
  _ = {
    extend: require("lodash.assignin"),
    each: require("lodash.foreach")
  },
  path = require("path");

require("../tests/preamble")( __filename, [{
  href: "/a/sceneManagerServer",
  rel: "",
  rt: ["core.scenes"],
  "if": ["oic.if.baseline"]
}], path.resolve(path.join(__dirname, "..")));

_.extend(device.device, {
  coreSpecVersion: "res.1.1.0",
  dataModels: ["something-else.1.0.0"],
  name: "sceneManager-server"
});

_.extend(device.platform, {
  manufacturerName: "Intel",
  manufactureDate: new Date("Wed Sep 23 10:04:17 EEST 2015"),
  platformVersion: "1.1.1",
  firmwareVersion: "0.0.1",
  supportUrl: "http://example.com"
});

function handleError(error) {
  console.error(error);
  process.exit(1);
}

var sceneResourceRequestHandlers = {
  retrieve: function(request) {
    request.respond(request.target).catch(handleError);
    console.log("Got a retrieve function request");
  },
  update: function(request) {
    console.log("Got an update request");
  }
}

if(device.device.uuid) {
  console.log("Registering OCF resource");

  server.register({
    resourcePath: "/a/sceneManagerServer",
    resourceTypes: ["core.server"],
    interfaces: ["oic.if.baseline"],
    discoverable: true,
    observable: true,
    properties: {"light": {"status" : "off", "intensity" : null},
      "door": "closed" }
  }).then(function(resource) {
      console.log("OCF resource successfully registered");
      sceneResource = resource;

      _.each(sceneResourceRequestHandlers, function(callback, requestType) {
        resource["on" + requestType](function(request) {
          callback(request);
        });
      })
    }, handleError);
}

var sceneDefs = {
  'unidentified': { 'light': { 'status': 'off', 'intensity' : null },
									  'door' : 'closed' },
  'Shadman': { 'light': { 'status': 'on', 'intensity' : 'low' },
							 'door' : 'open' },
  'Sachin' : { 'light': { 'status': 'on', 'intensity' : 'low' },
							 'door' : 'open' },
  'Venky'	 : { 'light': { 'status': 'on', 'intensity' : 'med' },
						   'door' : 'open' },
  'Mike'   : { 'light': { 'status': 'on', 'intensity' : 'high' },
						   'door' : 'open' } , // Note that when this is inside another object, there are errors
};

var updateHandler = function(resource) {
  var scene = fidoResource.properties["userAuthenticated"];
  console.log("Updating room settings to :" + JSON.stringify(sceneDefs[scene], null, 4));
  sceneResource.properties = sceneDefs[scene];
  sceneResource.notify().catch(handleError);
}

client.on("resourcefound", function(resource) {
  if(resource.resourcePath.startsWith("/a/")){
    // This will let you know which relevant resources are seen
    // For this demo purpose, the href will begin with '/a/'
    console.log(resource.resourcePath);
  }
  if(resource.resourcePath === "/a/fidoServer") {
    console.log("Found FIDO");
    fidoResource = resource;
    resource.on("update", updateHandler)
  }
});

client.findResources().catch(handleError); // This is the initial call to discovery
setInterval(function(){ // This sets up the loop of discovery
  console.log("Issuing discovery request");
  client.findResources().catch(handleError);
}, 5000)

process.on("SIGINT", function() {
  console.log("Exiting...");
  process.exit(0);
});
