# node-red-contrib-zip

Node-RED node to create and read ZIP files. Based on [jszip](https://github.com/Stuk/jszip)

A function that parses the `msg.payload` to convert a Buffer to/from a ZIP object. 
Places the result back into the payload.

If **Mode** is *Compress*, the output is always a Buffer with a ZIP content, and the input 
payload can be one of the following:


* **Buffer/String:** The payload is compressed as a single file in the resulting ZIP. The **Filename** 
specifies the name of this file, or can be specified with `msg.filename` if the configuration is left empty
* **Array:** An array of objects containing `filename` as a String and `payload` as 
a Buffer/String, each representing one file in the resultiing zip

If **Mode** is *Decompress*, the input payload is expected to be a Buffer, and the output is an Array with
objects containing `filename` as a String and `payload` as a Buffer


## License

Copyright 2017-2020 Guilherme Francescon Cittolin, [Apache 2.0 license](LICENSE).