//@ts-check
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

const util = require('util');

function nrInputShim(node, fn) {
    node.on('input', function (msg, send, done) {
        send = send || node.send;
        done = done || (err => err && node.error(err, msg));
        fn(msg, send, done);
    });
}

module.exports = function (RED) {
    const JSZip = require("jszip");

    function ZipNode(config) {
        RED.nodes.createNode(this, config);
        this.property = config.property||"payload";
        this.outproperty = config.outproperty||config.property||"payload";
        const node = this;

        function onInput(msg, send, done) {
            let zip, f;
            var value = RED.util.getMessageProperty(msg,node.property);

            if (config.mode === "compress") {
                zip = new JSZip();

                let level = parseInt(config.compressionlevel);
                if (isNaN(level)) level = 6; //default

                if (Array.isArray(value)) {
                    for (var i in value) {
                        f = value[i];

                        if (typeof f.filename !== 'string') {
                            done(RED._('zip.error.filename-type-string'));
                            return;
                        }

                        if (!(f.payload instanceof Buffer || typeof f.payload == 'string')) {
                            done(RED._('zip.error.payload-type-buffer-string'));
                            return;
                        }

                        zip.file(f.filename, f.payload);
                    }
                }
                else {
                    if (!(value instanceof Buffer || typeof value == 'string')) {
                        done(RED._('zip.error.payload-type-buffer-string'));
                        return;
                    }

                    zip.file(config.filename || msg.filename || 'file', value);
                }

                zip.generateAsync({
                    type: 'nodebuffer',
                    compression: level ? 'DEFLATE' : 'STORE',
                    compressionOptions: { level }
                }).then(function (data) {
                    //sends message
                    RED.util.setMessageProperty(msg,node.outproperty,data);
                    send(msg);
                    done();
                }).catch(function (err) {
                    //catches errors
                    done(RED._('zip.error.parse', { err: err }));
                })

            } else if (config.mode === "decompress") {

                if (!(value instanceof Buffer)) {
                    done(RED._("zip.error.payload-type-buffer"));
                    return;
                }

                zip = new JSZip();
                zip.loadAsync(value).then(function () {
                    //read files

                    const promises = [];
                    zip.forEach(function (path, zFile) {
                        promises.push(zFile.async(config.outasstring ? 'string' : 'nodebuffer').then(function (content) {
                            return {
                                filename: path,
                                payload: content
                            };
                        }));
                    });

                    return Promise.all(promises);
                }).then(function (files) {
                    //send the result
                    RED.util.setMessageProperty(msg,node.outproperty,files);
                    send(msg);
                    done();
                }).catch(function (err) {
                    //catches errors
                    done(RED._('zip.error.parse', { err: err }));
                });
            }
        };

        nrInputShim(this, onInput);
    }
    RED.nodes.registerType("zip", ZipNode);
}
