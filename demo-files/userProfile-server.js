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

var userProfileResource, fidoResource,
		_ = {
			extend: require( "lodash.assignin" ),
			each: require( "lodash.foreach" )
		},
		path = require( "path" )
		observerCount = 0;

require( "../tests/preamble" )( __filename, [ {
	href: "/a/userProfileServer",
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
var userSettings = {
  'unidentified': { 'light': { 'status': 'off', 'color' : 'green' },
									  'door' : { 'status': 'closed' } },
  'Shadman': { 'light': { 'status': 'on', 'color' : 'green' },
							 'door' : { 'status': 'open' } },
  'Sachin' : { 'light': { 'status': 'on', 'color' : 'blue' },
							 'door' : { 'status': 'open' } },
  'Venky'	 : { 'light': { 'status': 'on', 'color' : 'red' },
						   'door' : { 'status': 'open' } },
  'Mike'   : { 'light': { 'status': 'on', 'color' : 'purple' },
						   'door' : { 'status': 'open' } },
}

function handleError( theError ) {
	console.error( theError );
	process.exit( 1 );
}

var userProfileRequestHandlers = {
  retrieve: function(request) {
    					request.respond(request.target).catch(handleError);
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
		resourcePath: "/a/userProfileServer",
		resourceTypes: [ "core.sensor" ],
		interfaces: [ "oic.if.baseline" ],
		discoverable: true,
		observable: true,
		properties: { 'light': { 'status': 'off', 'color' : 'green' },
									'door' : { 'status': 'closed' } }
	} ).then(
		function( resource ) {
			console.log( "OCF resource successfully registered" );
			userProfileResource = resource;

			// Add event handlers for each supported request type
			_.each( userProfileRequestHandlers, function( callback, requestType ) {
				resource[ "on" + requestType ]( function( request ) {
					callback( request );
				} );
			} );
		},
		function( error ) {
			throw error;
		} );
}


var updateHandler = function(resource) {
	console.log(userSettings[fidoResource.properties.userAuthenticated]);
	userProfileResource.properties = userSettings[fidoResource.properties.userAuthenticated];
	userProfileResource.notify().catch(function(error){console.log(error);});
}

// Find a FIDO device to send your data to
client.on('resourcefound', function(resource) {
            if ( resource.resourcePath === "/a/fidoServer" ) {
              console.log("Found the FIDO resource");
              fidoResource = resource;
              resource.on("update", updateHandler);
            }
          });

console.log("Issuing discovery request");
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
