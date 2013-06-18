
function uploadFile(file){
// for new webkit browsers, the .slice() method is named .webkitSlice()
// similar for mozilla
File.prototype.slice = File.prototype.webkitSlice || File.prototype.mozSlice || File.prototype.slice;

var slices;
var uploadedSlices = 0;
var chunk_size = 1000000;
var file;

uploadFile.prototype.uploadChunk = function(bFile, chunk, file_name){

	var data = new FormData();
	data.append('file', bFile);
	data.append('index', chunk);
	data.append('name', file_name);

	var req = new XMLHttpRequest();
	
	req.open("POST", "upload.php", true);
	req.onload = function(oEvent) {
	    if (req.status == 200) {
	      output.innerHTML = output.innerHTML + "Uploaded chunk! ";
	      
	    } else {
	      output.innerHTML = "Error " + req.status + " occurred uploading your file.<br \/>";
	    }
	  };
	  req.send(data);
	 
}

uploadFile.prototype.mergeFile = function(){
    var xhr;
    var fd;

    xhr = new XMLHttpRequest();

    fd = new FormData();
    fd.append("name", "uploaded.mov");
    fd.append("index", slices);

    alert(slices);
    xhr.open("POST", "merge.php", true);
    xhr.send(fd);
};

uploadFile.prototype.init = function(){
	
};

uploadFile.prototype.UploadFile = function(){
	
	
};
uploadFile.prototype.sendForm = function(){
	
	
	if(window.File && window.Blob){
		//all file API supported
	}else{
		alert('The file APIs are not fully supported in this browser. ');
	}
	var 
		output = document.getElementById("output");

	var fileInput =  document.getElementById("inputFile");
	var files = fileInput.files;
	if (files.length === 0) {
		console.log('No input file found');
		return;
	}
	var file = files[0];
	var fileName = file.name;
	
	
	console.log('File:');
	console.log(file);
	

	//var fname = 0;
	slices = Math.ceil(file.size%chunk_size);
	for(var i=0;i<slices;i++){
	    var start = uploadedSlices * chunk_size;
	    var end = Math.min(start + chunk_size, file.size);
		var myBlob = file.slice(start, end);
		var fname = fileName.slice(0,fileName.length-4)+ uploadedSlices +fileName.slice(fileName.length-4, fileName.length);
		
		UploadFile(myBlob,uploadedSlices, fname);
		//fname++;
		uploadedSlices++;
	}
	//mergeFile();
}
};
