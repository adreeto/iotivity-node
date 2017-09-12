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
const client = device.client;

var doorResource,
  _ = {
    extend: require("lodash.assignin")
  },
  path = require("path");

require( "../tests/preamble" )( __filename, [ {
	href: "/a/lightServer",
	rel: "",
	rt: [ "core.light" ],
	"if": [ "oic.if.baseline" ]
} ], path.resolve( path.join( __dirname, ".." ) ) );

_.extend( device.device, {
	coreSpecVersion: "res.1.1.0",
	dataModels: [ "something.1.0.0" ],
	name: "light-server"
} );

_.extend( device.platform, {
	manufacturerName: "Intel",
	manufactureDate: new Date( "Wed Sep 23 10:04:17 EEST 2015" ),
	platformVersion: "1.1.1",
	firmwareVersion: "0.0.1",
	supportUrl: "http://example.com/"
} );

var onUpdate = function (resource){
  console.log("Door is " + doorResource.properties.door);
}

client.on("resourcefound", function(resource){
  if(resource.resourcePath === '/a/sceneManagerServer') {
    doorResource = resource;
    resource.on("update", onUpdate);
  }
});

client.findResources().catch(function(error){console.log(error);});
