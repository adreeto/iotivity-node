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
const readline = require("readline");
const server = device.server;

var visionResource,
		_ = {
			extend: require( "lodash.assignin" ),
			each: require( "lodash.foreach" )
		},
		path = require( "path" )
		observerCount = 0;

require( "../tests/preamble" )( __filename, [ {
	href: "/a/visionSensor",
	rel: "",
	rt: [ "core.sensor" ],
	"if": [ "oic.if.baseline" ]
} ], path.resolve( path.join( __dirname, ".." ) ) );

_.extend( device.device, {
	coreSpecVersion: "res.1.1.0",
	dataModels: [ "something.1.0.0" ],
	name: "visionSensor-server"
} );
_.extend( device.platform, {
	manufacturerName: "Intel",
	manufactureDate: new Date( "Wed Sep 23 10:04:17 EEST 2015" ),
	platformVersion: "1.1.1",
	firmwareVersion: "0.0.1",
	supportUrl: "http://example.com/"
} );

function handleError(theError) {
	console.error(theError);
	process.exit(1);
}

var visionResourceRequestHandlers = {
	retrieve: function(request) {
							request.respond(request.target)
										 .catch(handleError);
							observerCount += ("observe" in request) ? (request.observe ? 1 : -1) : 0;
							console.log("Got a retrieve request");
							if("observer" in request) {
								if(request.observe) {
									console.log("Added an observer");
								}
								else {
									console.log("Removed an observer");
								}
							}
						}
}

if ( device.device.uuid ) {
	console.log( "Registering OCF resource" );

	server.register( {
		resourcePath: "/a/visionSensor",
		resourceTypes: [ "core.sensor" ],
		interfaces: [ "oic.if.baseline" ],
		discoverable: true,
		observable: true,
		properties: { templateMatched: "unidentified" }
	} ).then(
		function( resource ) {
			console.log( "OCF resource successfully registered" );
			visionResource = resource;

			// Add event handlers for each supported request type
			_.each( visionResourceRequestHandlers, function( callback, requestType ) {
				resource[ "on" + requestType ]( function( request ) {
					callback( request );
				} );
			} );
		},
		function( error ) {
			throw error;
		} );
}

function templateMatch(template) {
	if (['0', '1', '2', '3', '4'].indexOf(template) > -1) {
		console.log("Recieved press: " + template);
		// templateMatched
		if (['1', '2', '3', '4'].indexOf(template) > -1) {
			visionResource.properties.templateMatched = template;
		} else {
			visionResource.properties.templateMatched = "unidentified";
		}
		visionResource.notify()
									.catch(function(error){
										console.log("Error while notifying: " + error.message);
									});
	}
}

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', function(str, key) {
	if(key.ctrl && key.name === 'c') {
		process.emit("SIGINT");
	}
	templateMatch(key.name)
});

process.on("SIGINT", function() {
	console.log("Exiting...");
	process.exit(0);
});
