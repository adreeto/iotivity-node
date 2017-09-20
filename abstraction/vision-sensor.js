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

const device = require("iotivity-node"); // change to ocfDevice
const readline = require("readline");    // change to npmReadline
const server = device.server;            // change to ocfServer - this is a high level interface\
const client = device.client; // We're adding this so we can notify everyone that we are online again

var visionResource,
		_ = {  // This is how the lodash libraries are represented
			extend: require( "lodash.assignin" ),
			each: require( "lodash.foreach" )
		},
		path = require( "path" )
		observerCount = 0;

//// Device and platform identification information
require( "../tests/preamble" )( __filename, [ { // Ask gabriel what this does
	href: "/a/visionSensor", // Shadman: this is where you change references to resources
	rel: "",
	rt: [ "core.sensor" ], // figure out this resource type
	"if": [ "oic.if.baseline" ] // figure out this interface
} ], path.resolve( path.join( __dirname, ".." ) ) );

_.extend( device.device, { // find out how and when this is used
	coreSpecVersion: "res.1.1.0",
	dataModels: [ "something.1.0.0" ],
	name: "visionSensor-server"
} );

_.extend( device.platform, {// find out how and when this is used
	manufacturerName: "Intel",
	manufactureDate: new Date( "Wed Sep 23 10:04:17 EEST 2015" ),
	platformVersion: "1.1.1",
	firmwareVersion: "0.0.1",
	supportUrl: "http://example.com/"
} );

//// Ask gabriel about point to point security
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

if ( device.device.uuid ) { // ask where and how and who uuid is defined
	console.log( "Registering OCF resource" );

	server.register( { /// How do you define multiple servers of same type? (two lights in a room)
		resourcePath: "/a/visionSensor",
		resourceTypes: [ "core.sensor" ],
		interfaces: [ "oic.if.baseline" ],
		discoverable: true,
		observable: true,
		properties: { templateMatched: "unidentified", // this will send the index, not always string
									timestamp: new Date(), // timestamp when the template match occurred
	                deviceID: "DEVICEID",  // deviceID: deviceID
									uuid: "uuid",
								} // Shadman: defined these properties
	} ).then( function( resource ) {
		console.log( "OCF resource successfully registered" );
		visionResource = resource;

		// Add event handlers for each supported request type
		_.each( visionResourceRequestHandlers, // change based on your requestHandlers
			function( callback, requestType ) {
			resource[ "on" + requestType ]( function( request ) {
				callback( request );
			});
		});
	},
	handleError);
}

/*
   Checks for a string input - if that input is 0, 1, 2, 3, 4
*/
function matchTemplate(template) { // rename to functionTemplateMatch
	if (['0', '1', '2', '3', '4'].indexOf(template) > -1) {
		console.log("Recieved press: " + template);
		// templateMatched
		if (['1', '2', '3', '4'].indexOf(template) > -1) {
			visionResource.properties.templateMatched = template;
		} else {
			visionResource.properties.templateMatched = "unidentified";
			visionResource.properties.timestamp = new Date();
		}
		visionResource.notify() // this will notify all observers
			.catch(handleError);
		console.log(visionResource);
	}
}

// local registration index and template value (tuple)
function registerTemplate() {

} // be able to register a new template

function setupInput() {
	readline.emitKeypressEvents(process.stdin);
	process.stdin.setRawMode(true);
	process.stdin.on('keypress', function(str, key) {
		if(key.ctrl && key.name === 'c') {
			process.emit("SIGINT");
		}
		matchTemplate(key.name)
	});

	process.on("SIGINT", function() {
		console.log("Exiting...");
		process.exit(0);
	});
} // Define this so you can get an input for the template to match

setupInput();
