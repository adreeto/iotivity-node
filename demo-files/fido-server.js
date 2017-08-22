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

var fidoResource, visionResource
  	_ = {
  		extend: require( "lodash.assignin" ),
  		each: require( "lodash.foreach" )
  	},
  	path = require( "path" )
  	observerCount = 0;

require( "../tests/preamble" )( __filename, [ {
	href: "/a/fidoServer",
	rel: "",
	rt: [ "core.authenticate" ],
	"if": [ "oic.if.baseline" ]
} ], path.resolve( path.join( __dirname, ".." ) ) );

_.extend( device.device, {
	coreSpecVersion: "res.1.1.0",
	dataModels: [ "something.1.0.0" ],
	name: "fido-server"
} );
_.extend( device.platform, {
	manufacturerName: "Intel",
	manufactureDate: new Date( "Wed Sep 23 10:04:17 EEST 2015" ),
	platformVersion: "1.1.1",
	firmwareVersion: "0.0.1",
	supportUrl: "http://example.com/"
} );

function handleError( theError ) {
	console.error( theError );
	process.exit( 1 );
}

var fidoResourceRequestHandlers = {
  retrieve: function(request) {
    request.respond(request.target)
					 .catch(handleError);
              console.log("Got a retrieve function request");
              observerCount += ("observe" in request) ? (request.observe ? 1 : -1) : 0;
          		console.log("Added to observers");
            },
  update: function( request ) {
            console.log("Got an update request");
          }
};

if ( device.device.uuid ) {
	console.log( "Registering OCF resource" );

	server.register( {
		resourcePath: "/a/fidoServer",
		resourceTypes: [ "core.sensor" ],
		interfaces: [ "oic.if.baseline" ],
		discoverable: true,
		observable: true,
		properties: { userAuthenticated: "unidentified" }
	} ).then(
		function( resource ) {
			console.log( "OCF resource successfully registered" );
			fidoResource = resource;

			// Add event handlers for each supported request type
			_.each( fidoResourceRequestHandlers, function( callback, requestType ) {
				resource[ "on" + requestType ]( function( request ) {
					console.log( "Received request " + JSON.stringify( request, null, 4 ) );
					callback( request );
				} );
			} );
		},
		function( error ) {
			throw error;
		} );
}

// Find a FIDO device to send your data to
console.log("Issuing discovery request");

var userDict = {
  unidentified: 'unidentified',
  1: 'Shadman',
  2: 'Sachin',
  3: 'Venky',
  4: 'Mike',
}

var updateHandler = function(resource) {
  var user = userDict[visionResource.properties['templateMatched']];
  console.log(user + " is seen");
  fidoResource.properties['userAuthenticated'] = user;
  fidoResource.notify().catch(function(error){
    console.log("Error while notifying: " + error.message);
  });
}

client.on('resourcefound', function(resource) {
            if ( resource.resourcePath === "/a/visionSensor" ) {
              console.log("Found the vision resource");
              visionResource = resource;
              resource.on("update", updateHandler);
            }
          });

client.findResources()
      .catch( function( error ) {
        console.error( error.stack ? error.stack :
          ( error.message ? error.message : error ) );
        process.exit( 1 );
      });

process.on("SIGINT", function() {
  console.log("Exiting...");
  process.exit(0);
});
