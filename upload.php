<?php 

session_start();
if(!isset($_SESSION['uid']))
	$_SESSION['uid'] = session_id().time();
	
if(!file_exists("upload/")){
	mkdir("upload/");
}

function uuid($len=32) {
	return substr(md5(uniqid(mt_rand(), true)), 0, $len);
}

if (!isset($_SESSION['uploadMap'] )) {
	$_SESSION['uploadMap']  = array();
}
$uploadID = $_REQUEST['name'] +':'+ $_REQUEST['size'];

if (isset($_SESSION['uploadMap'][$uploadID])) {
	$fileID = $_SESSION['uploadMap'][$uploadID];
} else {
	$fileID = uuid();
	$_SESSION['uploadMap'][$uploadID] = $fileID;
}

if(isset($_REQUEST['chunk_size'])){//initialize request
	$fileFound = false;
	$index = 0;

	
	if ($handle = opendir('upload/')){
		while (false !== ($entry = readdir($handle)) && !$fileFound){
			if(pathinfo($entry)['filename'] === $fileID){
				$fileFound = true;
				$index = filesize("upload/".$entry) / $_REQUEST['chunk_size'];
			}
		}
		echo json_encode($index);
		closedir($handle);	
	}
	

}else{//upload chunk request
	if(!isset($_REQUEST['name'])) throw new Exception('Name required');
	if(!preg_match('/^[-a-z0-9_][-a-z0-9_.\s]*$/i', $_REQUEST['name'])) throw new Exception('Name error');
	
	if(!isset($_REQUEST['index'])) throw new Exception('Index required');
	if(!preg_match('/^[0-9]+$/', $_REQUEST['index'])) throw new Exception('Index error');
	
	if(!isset($_FILES['file'])) throw new Exception('Upload required');
	if($_FILES['file']['error'] != 0) throw new Exception('Upload error');
	
	//if(!isset($_REQUEST['type'])) throw new Exception('File type required');
	if(!isset($_REQUEST['totalSlices'])) throw new Exception('Number of total slices required');
	
	//$fileMappings = array ($_SESSION['fileID'] => $_REQUEST['name']);//fileID to session mapping
	$targetFile = "upload/" . $fileID;
	$tempchunk = $targetFile . '-' . $_REQUEST['index'];
	$fileType = pathinfo($_REQUEST['name'])['extension'];
	
	move_uploaded_file($_FILES['file']['tmp_name'], $tempchunk);
	
	$dst = fopen($targetFile, 'ab');
	
	echo "\nOriginal File Name: " . $_REQUEST['name'];
	echo "\nFile Name on server: " . $targetFile;
	echo "\nTarget File: " . $tempchunk;
	echo "\nFile ID:" . $fileID; 
	echo "\nCurrent slice: " . $_REQUEST['index'];
	echo "\nTotal Slices: ". $_REQUEST['totalSlices'];
	echo "\nFile Type: " . $fileType;
	
	if($slice = $tempchunk){
		$src = fopen($slice, 'rb');
		stream_copy_to_stream($src, $dst);
		fclose($src);
		unlink($slice);
	}
	fclose($dst);

	if($_REQUEST['index'] == $_REQUEST['totalSlices']-1){
		if(rename($targetFile, $targetFile.".".$fileType))
			echo "\nFile renamed successfuly from ".$targetFile." to ".$targetFile.".".$fileType;
		else
			echo "File renaming unsuccessful";
	}
	
}

?>