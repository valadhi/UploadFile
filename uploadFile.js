'use strict';

// for new webkit browsers, the .slice() method is named .webkitSlice()
// similar for mozilla
File.prototype.slice = File.prototype.webkitSlice || File.prototype.mozSlice || File.prototype.slice;

var UploadAdapter = function(config){
	
	this.file = config.file;
	this.chunk_size = config.chunk_size;
	this.delegate = config.delegate;
	
	this.totalSlices = 0;
	this.uploadedSlices = 0;
	this.state = 'waiting';
	this.file_name = null;
	this.size = 0;
};

UploadAdapter.prototype = {
		
		start : function() {
			var jason;//response from server
			var xhr;
			var fd;
			
			xhr = new XMLHttpRequest();
			fd = new FormData;
			
			if(window.File && window.Blob){
				//all file API supported
			}else{
				alert('The file APIs are not fully supported in this browser. ');
			}

			this.file_name = this.file.name;
			console.log('File:');
			console.log(this.file);
			this.totalSlices = Math.ceil(this.file.size/this.chunk_size);
			
			fd.append("name", this.file_name);
			fd.append("chunk_size", this.chunk_size);
			fd.append("size", this.file.size);
			
			this.state = 'uploading';
			//this.uploads[id] = {'status' : 'uploading' };
			
			var self = this;
			xhr.onreadystatechange = function(){
				if (xhr.readyState == 4){
					jason = Math.ceil(JSON.parse(xhr.response));
					if(jason == 0){
						console.log('File not found; start anew');
						console.log("Uploading file " + self.file.name + " of size " + self.file.size + " bytes...");
						self.state = "uploading";
						self.UploadFile();
					}else{
						if(jason == self.totalSlices){
							//alert(jason + " " + self.totalSlices + " " + self.file.size);
							console.log("File already exists");
							//this.delegate.fileCount--;
							self.state = 'existed';
							self.delegate.complete();
						}
						else{
							console.log('Found partial file; resuming....');
							self.state = "uploading";
							self.uploadedSlices = jason;
							//alert(this.uploadedSlices);
							self.UploadFile();
						}
					}
				}
			};
			xhr.open("POST", "upload.php", true);
			xhr.send(fd);
		},
		
		UploadFile: function () {
			if(this.uploadedSlices != this.totalSlices){
			    var start = this.uploadedSlices * this.chunk_size;
			    var end = Math.min(start + this.chunk_size, this.file.size);
				var myBlob = this.file.slice(start, end);

				this.UploadChunk(myBlob,this.uploadedSlices);
			}else{
				this.complete();			
			}
		},
		
		UploadChunk: function (bFile, chunk){
			if(this.state === "uploading"){
				var data = new FormData();
				
				data.append('file', bFile);
				data.append('index', chunk);
				data.append('name', this.file_name);
				data.append('totalSlices', this.totalSlices);
				data.append("size", this.file.size);
				//alert(file_name);
				var req = new XMLHttpRequest();
				
				self = this;
			    req.onreadystatechange = function(){
			    	if(req.readyState == 4){
			    		self.uploadedSlices++;
			    		self.UploadFile();
			    	}
			    };	 
				req.open("POST", "upload.php", true);
				req.onload = function(oEvent) {
				    if (req.status == 200) {
				      console.log("Uploaded chunk " + chunk + " of file " + self.file_name);
				      
				    } else {
				      console.log("Error " + req.status + " occurred uploading your file.");
				    }
				  };
				  req.send(data);
			}else
				//console.log("Upload stopped");
				return;			 
			},

			pause : function(){
				
				if(this.state !== 'waiting'){
					console.log('Upload Paused');
					this.state = 'paused';
				}

			},
			
			cancel : function(){
				//this.form.remove();
				if(this.state !== "waiting"){
					this.state = 'aborted';
					console.log('Upload Stopped');
				}
				
			},
			
			complete : function() {
				this.delegate.complete();
			}
	
};

var UploadItem = function(config){
	
	//this.delegate = config.delegate; 
	this.ID = config.id;
	this.form = config.form;
	
	this.file = null;
	this.state = 'waiting';
	this.file_name = null;
	this.size = 0;
	//this.chunk_size = 25000000;

	

};


UploadItem.prototype = {
	
};

var UploadOperation = function(config){
	
	this.delegate = config.delegate;
	this.ID = config.id;
	
	this.file = null;
	this.form = null;
	this.uploadItem = null;
	
	this.uploadAdapter = null;

	this.renderForm();
	this.clickHandlers();
};

UploadOperation.prototype = {
		
		renderForm: function() {

			this.form = $('<form id="fileItem-'+this.ID+'" enctype="multipart/form-data" method="post" name="fileinfo"></form>');
			
			this.form.html('<label>File to upload:</label><input type="file" name="file" required />' +
					  '<div class="output"></div><input type="button" name="upload" value="Upload File" />'+
					  '<span class="cancelButton">Cancel</span> <span class="pauseButton">Pause</span>');
			
			this.uploadItem = new UploadItem({
				id : this.ID,
				form : this.form
			});
			
			$('#upload').append(this.form);
		},
		
		clickHandlers : function() {
			
			if (!this.form) {
				return;
			}
			var self = this;
			
			this.form.find('span[class="cancelButton"]').click(function() {
				self.uploadAdapter.cancel();
			});
			
			this.form.find('span[class="pauseButton"]').click(function() {
				self.form.find('span[class="pauseButton"]').replaceWith('<span class="startButton">Start</span>');
				self.uploadAdapter.pause();
				//alert(uploadAdapter);
				self.restartButtonClickHandler();
			});
				
			this.form.find('input[name="upload"]').click(function() {
				self.startUpload();
			});
			//this.form.find('input[name="upload"]').click($.proxy(this.onClick, this));
		},
		
		restartButtonClickHandler : function(){
			var self = this;
			this.form.find('span[class="startButton"]').click(function() {
				self.form.find('span[class="startButton"]').replaceWith('<span class="pauseButton">Pause</span>');
				self.clickHandlers();
				self.start();
			});
		},
		
		startUpload: function() {
			
			//console.log('Upload ITEM Click on id');
			//console.log(this.ID);

			
				var fileInput = this.form.find('input[name="file"]')[0];
				var files = fileInput.files;
				
				if (files.length === 0){
					console.log('No input file found');
					return;
				}
				var file = files[0];
				this.file = file;
				this.uploadAdapter = new UploadAdapter({
					chunk_size : 25000000,
					file : this.file,
					delegate : this
				});
				this.delegate.queue(this);
				this.form.find("input[name=upload]").remove();

		},
		
		start : function(){
			this.uploadAdapter.start();
		},
		
		complete : function() {
			if(this.uploadAdapter.state !== "existed"){
				this.form.find("span").remove();
				this.form.find("div[class=output]").html("<b>File uploaded successfully!</b>");
				
				console.log("File uploaded successfully!");
				this.uploadAdapter.state = "done";
				this.delegate.complete(this);
			}else{
				this.form.find("span").remove();
				this.form.find("div[class=output]").html("<b>File already exists</b>");
				
				this.delegate.complete(this);
			}

		}
};

var UploadController = function() {

	//this.type = null;
	//this.file = null;
	//this.file_name = null;
	//this.uploading = null;
	//this.init(file);
	
	this.nextUploadID = 0;
	
	this.uploads = [];
	this.activeUploads = [];
	
	this.clickHandlers();
	
};
	UploadController.prototype = {
			
			queue : function(item){
				
				//this.uploads[this.nextUploadID] = item;
				this.uploads.push(item);
				if(this.activeUploads.length == 0){
					this.activeUploads.push(item);
					this.activeUploads[0].start();
					}else{
					this.activeUploads.push(item);
				}
				console.log("Queued item: " + item.ID);
			},
					
			clickHandlers: function(){
				
				var self = this;
				$("body").on("click", "#addUpload", function(){
					var upload = new UploadOperation({
						id: self.nextUploadID,
						delegate: self
					});
					self.nextUploadID++;
				});
				
//				$("body").on("click", "#seeQueue", function(){
//					alert("Queue: " + self.uploads.toString() + " size: " + self.uploads.length);
//				});
//				
//				$("body").on("click", "#activeElem", function(){
//					alert("Active elements: " + self.activeUploads.toString());
//				});					
			},
			

			stop: function (){
				this.uploading = false;
				alert("stop button pressed");
			},
			
			onclick : function(){
				
			},
			
			complete: function(fileItem) {
				
				this.activeUploads.shift();
				this.uploads.splice(fileItem.ID,1);
				//initiate next item in queue
				if(this.activeUploads.length !=0 ){
					this.activeUploads[0].start();
				}/*else{
					console.log("finished active items queue");
				}*/
				
				if(fileItem.state !== 'existed'){
					console.log("File " + fileItem.ID + " has completed");
				}
				
				//fileItem.priority;
			}
			
	};

$().ready(function() {
	window.upload = new UploadController();
});