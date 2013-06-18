// for new webkit browsers, the .slice() method is named .webkitSlice()
// similar for mozilla
File.prototype.slice = File.prototype.webkitSlice || File.prototype.mozSlice || File.prototype.slice;

var UploadItem = function(file){
	
	this.file = null;
	this.ID = 0;
	this.state = null;
	this.file_name = null;
	this.size = 0;
	this.chunk_size = 25000000;
	this.totalSlices = 0;
	this.uploadedSlices = 0; 
	
	this.start(file);
};


UploadItem.prototype = {
	start : function(file){
		// Initialise click handlers!
		this.clickHandlers();
		this.file = file;
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
		console.log(file);
		this.totalSlices = Math.ceil(this.file.size/this.chunk_size);
		
		fd.append("name", this.file_name);
		fd.append("chunk_size", this.chunk_size);
		fd.append("size", this.file.size);
		
		state = 'uploading';
		//this.uploads[id] = {'status' : 'uploading' };
		
		var self = this;
		xhr.onreadystatechange = function(){
			if (xhr.readyState == 4){
				jason = Math.ceil(JSON.parse(xhr.response));
				if(jason == 0){
					console.log('File not found; start anew');
					console.log("Uploading file " + self.file.name + " of size " + self.file.size + " bytes...");
					self.uploading = true;
					self.UploadFile();
				}else{
					if(jason == self.totalSlices){
						alert(jason + " " + self.totalSlices + " " + this.file.size);
						console.log("File already exists");
					}
					else{
						console.log('Found partial file; resuming....');
						self.uploading = true;
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
			this.uploadedSlices = 0;
			output.innerHTML = output.innerHTML + "File uploaded successfully! <br>";
			console.log("File uploaded successfully");
			
		}
},

UploadChunk: function (bFile, chunk){
	if(this.uploading){
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
	
	clickHandlers : function(){
		
	}
};

var UploadController = function() {

	//this.type = null;
	this.file = null;
	//this.file_name = null;
	//this.uploading = null;
	//this.init(file);
	
	this.uploads = [];
	
};
	UploadController.prototype = {
			
			queue : function(file){
				var uploadItem = new UploadItem(file);
				this.uploads[0] = uploadItem;
			},
			
			renderForm: function() {
				
				var name= "string";
				
				$('#upload').append('<form id="uploadForm-'+name+'" enctype="multipart/form-data" method="post" name="fileinfo" >'+
						  '<label>File to upload:</label><input id="inputFile" type="file" name="file[]" required /></form>' +
						  '<div id="output"></div><input id="clickMe" type="button" value="Upload File" onclick="sendForm();" />'+
						  '<span id="stopButton">Stop</span><span id="addUpload" style="color:red">Add upload form</span>');
				
			},
			
			clickHandlers: function(){
				
				var self = this;
				
				$("body").on("click", "#stopButton", function(){
					console.log('Upload Stopped');
					self.stop();
				});
				
				$("body").on("click", "#addUpload", function(){
					self.renderForm();
				});
				
			},
			

			stop: function (){
				this.uploading = false;
				alert("stop button pressed");
			}
	};

function sendForm(state){
		var fileInput =  document.getElementById("inputFile");
		var files = fileInput.files;
		if (files.length === 0){
			console.log('No input file found');
			return;
		}
		file = files[0];
		var upload = new UploadController;
		upload.queue(file);
}