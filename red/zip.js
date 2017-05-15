/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    var JSZip = require("jszip");

    function ZipNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        function addEntry(zip, name, data) {
            if (typeof data == 'string') {
                data = Buffer.from(data);
            }
            zip.file(name, data);
        }
        
        this.on("input", function(msg) {
            var zip, f;

            if(config.mode == "compress") {
                zip = new JSZip();

                if(Array.isArray(msg.payload)) {
                    for(var i in msg.payload){
                        f = msg.payload[i];
                        
                        if(typeof f.filename !== 'string'){
                            node.error(RED._('zip.error.filename-type-string'));
                            return;
                        }

                        if(!(f.payload instanceof Buffer || typeof f.payload == 'string')){
                            node.error(RED._('zip.error.payload-type-buffer-string'));
                            return;
                        }

                        zip.file(f.filename, f.payload);
                    }
                } else {
                    if(!(msg.payload instanceof Buffer || typeof msg.payload == 'string')){
                        node.error(RED._('zip.error.payload-type-buffer-string'));
                        return;
                    }

                    zip.file(config.filename || msg.filename || 'file', msg.payload);
                }

                zip.generateAsync({
                    type: 'nodebuffer', 
                    compression: 'DEFLATE'
                }).then(function(data) {
                    //sends message

                    msg.payload = data;
                    node.send(msg);
                    
                }).catch(function(err){
                    //catches errors

                    node.error(RED._('zip.error.parse', {err: err}));
                })


            } else if(config.mode === "decompress") {

                if(!(msg.payload instanceof Buffer)) {
                    node.error(RED._("zip.error.payload-type-buffer"));
                    return;
                }

                zip = new JSZip();

                zip.loadAsync(msg.payload).then(function() {
                    //read files

                    var promises = [];

                    zip.forEach(function(path, zFile){
                        promises.push(zFile.async(config.outasstring ? 'string' : 'nodebuffer').then(function (content) {
                            return {
                                filename: path,
                                payload: content
                            };
                        }));
                    });

                    return Promise.all(promises);
                }).then(function(files) {
                    //send the result

                    msg.payload = files;
                    node.send(msg);
                }).catch(function (err) {
                    //catches errors

                    node.error(RED._('zip.error.parse', {err: err}));
                });
            }
        });
    }
    RED.nodes.registerType("zip",ZipNode);
}
