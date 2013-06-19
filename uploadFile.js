'use strict';

// for new webkit browsers, the .slice() method is named .webkitSlice()
// similar for mozilla
File.prototype.slice = File.prototype.webkitSlice || File.prototype.mozSlice || File.prototype.slice;

var UploadItem = function(config){
	
	this.delegate = config.delegate; 
	this.ID = config.id;
	
	this.file = null;
	this.state = 'waiting';
	this.file_name = null;
	this.size = 0;
	this.chunk_size = 25000000;
	this.totalSlices = 0;
	this.uploadedSlices = 0; 
	
	//this.start(file);

	this.renderForm();
	this.clickHandlers();
};


UploadItem.prototype = {
	start : function(){
		// Initialise click handlers!
		//this.clickHandlers();
		//this.file = file;
		//alert(this.ID);
		var jason;//response from server
		var xhr;
		var fd;
		//var output = document.getElementById("output");
		xhr = new XMLHttpRequest();
		fd = new FormData;
		
		if(window.File && window.Blob){
			//all file API supported
		}else{
			alert('The file APIs are not fully supported in this browser. ');
		}

		this.file_name = this.file.name;
		console.log('File:');
		console.log("HERE" + this.file);
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
						alert(jason + " " + self.totalSlices + " " + self.file.size);
						console.log("File already exists");
						//this.delegate.fileCount--;
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
	
	UploadFile: function (){
		if(this.uploadedSlices != this.totalSlices){
		    var start = this.uploadedSlices * this.chunk_size;
		    var end = Math.min(start + this.chunk_size, this.file.size);
			var myBlob = this.file.slice(start, end);

			this.UploadChunk(myBlob,this.uploadedSlices);
		}else{
			this.complete();			
		}
	},
	
	complete: function() {
		this.uploadedSlices = 0;
		//output.innerHTML = output.innerHTML + "File uploaded successfully! <br>";
		console.log("File uploaded successfully");
		this.state = "done";
		
		this.delegate.complete(this);
		
		
	},

UploadChunk: function (bFile, chunk){
	if(this.state === "uploading"){
		var data = new FormData();
		
		data.append('file', bFile);
		data.append('index', chunk);
		data.append('name', this.file_name);
		//data.append('type', this.type);
		data.append('totalSlices', this.totalSlices);
		data.append("size", this.file.size);
		//alert(file_name);
		var req = new XMLHttpRequest();
		
		self = this;
	    req.onreadystatechange = function(){
	    	if(req.readyState == 4){
	    		//alert(self.uploadedSlices);
	    		self.uploadedSlices++;
	    		self.UploadFile();
	    	}
	    };	
	    
		req.open("POST", "upload.php", true);
		req.onload = function(oEvent) {
		    if (req.status == 200) {
		      console.log("Uploaded chunk " + chunk + " of file " + self.file_name);
		      
		    } else {
		      output.innerHTML = "Error " + req.status + " occurred uploading your file.<br \/>";
		    }
		  };
		  req.send(data);
	}else
		//console.log("Upload stopped");
		return;			 
	  },
	pause : function(){
		state = 'paused';
	},
	
	cancel : function(){
		state = 'aborted';
	},
	
	clickHandlers : function() {
		
		if (!this.form) {
			return;
		}
		var self = this;
		
		$("body").on("click", "#stopButton", function(){
			console.log('Upload Stopped');
			self.pause();
		});
		
		this.form.find('input[name="upload"]').click(function() {
			self.onClick();
		});
		//this.form.find('input[name="upload"]').click($.proxy(this.onClick, this));
	},
	
	onClick: function() {
		
		//console.log('Upload ITEM Click on id');
		//console.log(this.ID);
		
		var fileInput = this.form.find('input[name="file"]')[0];
		var files = fileInput.files;
		console.log(files);
	
		//var currID = $("#uploadButton").siblings().attr('rel:fileInput');
		//alert(currID);
	//	var fileInput =  document.getElementById("inputFile-" + currID);
		var files = fileInput.files;
		
		if (files.length === 0){
			console.log('No input file found');
			return;
		}
		var file = files[0];
		this.file = file;
		this.delegate.queue(this);
	},
	
	renderForm: function() {

		this.form = $('<form  enctype="multipart/form-data" method="post" name="fileinfo"></form>');
		
		this.form.html('<label>File to upload:</label><input type="file" name="file" required />' +
				  '<div class="output"></div><input type="button" name="upload" value="Upload File" />'+
				  '<span class="stopButton">Stop</span>');
		
		$('#upload').append(this.form);
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
				//this.fileCount++;
				this.uploads[this.nextUploadID] = item;
				if(this.activeUploads.length == 0){
					this.activeUploads.push(item);
					this.activeUploads[0].start();
					}else{
					this.activeUploads.push(item);
				}
			},
			

			
			clickHandlers: function(){
				
				var self = this;
				$("body").on("click", "#addUpload", function(){
					var upload = new UploadItem({
						id: self.nextUploadID,
						delegate: self
					});
					self.nextUploadID++;
				});
				
			},
			

			stop: function (){
				this.uploading = false;
				alert("stop button pressed");
			},
			
			onclick : function(){
				
			},
			
			complete: function(fileItem) {
				
				this.activeUploads.shift();
				delete this.uploads[fileItem.ID];
				//initiate next item in queue
				if(this.activeUploads.length !=0 ){
					this.activeUploads[0].start();
				}else{
					console.log("fnished queue");
				}
				/*if(this.uploads[this.nextUploadID+1] !== null && this.uploads[this.nextUploadID+1] !== undefined){
					this.uploads[this.nextUploadID+1].start();
				}else{
					console.log("fnished queue");
				}*/
				alert(fileItem.ID + " file has completed");
				
				//fileItem.priority;
			}
			
	};

function sendForm() {
	var form = $(this).parent();
	
	var fileInput = form.find('input[name="file"]')[0];
	
	var uploadID = form.find('input[name="uploadID"]').val();
	
	console.log("SEE: " + uploadID);
	return;
		var currID = $("#uploadButton").siblings().attr('rel:fileInput');
		alert(currID);
	//	var fileInput =  document.getElementById("inputFile-" + currID);
		var files = fileInput.files;
		if (files.length === 0){
			console.log('No input file found');
			return;
		}
		var file = files[0];
		upload.queue(file);
}


$().ready(function() {
	window.upload = new UploadController();
	
	/*
	$('form.uploadForm').each(function() {
		
		var item = new UploadItem({
			form: $(this),
			delegate: window.upload,
			id: uploadID
		});
		uploadID++;
		
		uploadItems.push(item);
	});
	*/
});