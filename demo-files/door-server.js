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

var client = require("iotivity-node").client;
var userProfileResource;

var resourceUpdate = function(resource) {
  console.log("Got an update from the OCF User Profile Server");
};

client.on( "resourcefound", function(resource) {
  console.log(resource);
  if (resource.resourcePath === "/a/userProfileServer") {
    userProfileResource = resource;
    resource.on("update", resourceUpdate);
    console.log("got here fine");
  }
} );

console.log("Issuing discovery request");
client.findResources()
      .catch( function(error) {
        console.log("Caught an error");
        console.error(error.stack ? error.stack :
          (error.message ? error.message : error));
        process.exit(1);
      });

process.on( "SIGINT", function() {
  console.log("Exiting...");
  userProfileResource.removeListener("update", resourceUpdate);
  process.exit(0);
});
