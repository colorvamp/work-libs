<?php
	$GLOBALS['tables']['systemUsers'] = array('_id_'=>'INTEGER AUTOINCREMENT','userMail'=>'TEXT NOT NULL UNIQUE','userPass'=>'TEXT NOT NULL','userWord'=>'TEXT NOT NULL',
		'userName'=>'TEXT NOT NULL','userRegistered'=>'TEXT NOT NULL','userIP'=>'TEXT','userLastLogin'=>'TEXT',
		'userBirthday'=>'TEXT','userGender'=>'TEXT','userNick'=>'TEXT UNIQUE','userWeb'=>'TEXT','userBio'=>'TEXT','userPhrase'=>'TEXT','userModes'=>'TEXT',
		'userStatus'=>'TEXT','userTags'=>'TEXT','userCode'=>'TEXT');
	$GLOBALS['api']['users'] = array(
		'dir.users'=>'../db/api.users/',
		'db'=>'../db/api.users.db','table'=>'systemUsers',
		'reg.mail.clear'=>'/[^a-z0-9\._\+\-\@]*/');
	if(file_exists('../../db')){$p = dirname(__FILE__).'/';$GLOBALS['api']['users'] = array_merge($GLOBALS['api']['users'],array('dir.users'=>$p.'../../db/api.users/','db'=>$p.'../../db/api.users.db'));}
	include_once('inc.sqlite3.php');

	/* Necesitamos una doble sincronización, no podemos depender de un 
	 * repositorio único porque se saturaría por las reiteradas peticiones
	 * de los distintos usuarios.
	 */
	function users_create($data,$db = false){
		$valid = array('userName'=>0,'userBirth'=>0,'userMail'=>0,'userPass'=>0,'userGender'=>0,'userNick'=>0);
		include_once('inc.strings.php');
		foreach($data as $k=>$v){if(!isset($valid[$k])){unset($data[$k]);continue;}$data[$k] = strings_UTF8Encode($v);}
		$pass_a = array('?','$','¿','!','¡','{','}');
	    	$pass_b = array('a','e','i','o','u','b','c','d','f','g','h','j','k','l','m','n','p','q','r','s','t','v','w','x','y','z');
		$magicWordPre = '';for($a=0; $a<4; $a++){$magicWordPre .= $pass_a[array_rand($pass_a)];$magicWordPre .= $pass_b[array_rand($pass_b)];}

		/* Necesitamos tener la conexión con la base de datos desde aquí para las comprobaciones de algunos campos */
		$shouldClose = false;if(!$db){$db = sqlite3_open($GLOBALS['api']['users']['db']);sqlite3_exec('BEGIN',$db);$shouldClose = true;}
		$data['userName'] = preg_replace('/[^a-zA-ZáéíóúÁÉÍÓÚ ,]*/','',$data['userName']);
		if(empty($data['userName'])){if($shouldClose){sqlite3_close($db);}return array('errorCode'=>1,'errorDescription'=>'NAME_ERROR','file'=>__FILE__,'line'=>__LINE__);}
		if(!preg_match('/^[a-z0-9\._\+\-]+@[a-z0-9\.\-]+\.[a-z]{2,6}$/',$data['userMail'])){return array('errorCode'=>1,'errorDescription'=>'EMAIL_ERROR','file'=>__FILE__,'line'=>__LINE__);}
		/* Comprobamos mail duplicado */
		if(users_getSingle('(userMail = \''.$data['userMail'].'\')',array('db'=>$db))){if($shouldClose){sqlite3_close($db);}return array('errorCode'=>1,'errorDescription'=>'EMAIL_DUPLICATED','file'=>__FILE__,'line'=>__LINE__);}
		if(!isset($data['userPass']) || empty($data['userPass'])){$data['userPass'] = '';for($a=0; $a<6; $a++){$data['userPass'] .= $pass_a[array_rand($pass_a)];$data['userPass'] .= $pass_b[array_rand($pass_b)];}}
		$data['userPass'] = sha1($data['userPass']);

		if(!isset($data['userNick']) || empty($data['userNick'])){$data['userNick'] = sha1($data['userMail'].$data['userName']);}
		$date = date('Y-m-d H:i:s');
		$userCode = users_helper_generateCode($data['userMail']);
		$data = array_merge($data,array('userWord'=>$magicWordPre,'userRegistered'=>$date,'userStatus'=>0,'userModes'=>',regular,','userCode'=>$userCode));

		$r = sqlite3_insertIntoTable($GLOBALS['api']['users']['table'],$data,$db);
		if(!$r['OK']){if($shouldClose){sqlite3_close($db);}return array('errorCode'=>$r['errno'],'errorDescription'=>$r['error'],'file'=>__FILE__,'line'=>__LINE__);}
		$user = users_getSingle('(userMail = \''.$data['userMail'].'\')',array('db'=>$db));
		$user = array_merge($user,array('userCode'=>$userCode));
		if($shouldClose){$r = sqlite3_exec('COMMIT;',$db);$GLOBALS['DB_LAST_QUERY_ERRNO'] = $db->lastErrorCode();$GLOBALS['DB_LAST_QUERY_ERROR'] = $db->lastErrorMsg();if(!$r){sqlite3_close($db);return array('errorCode'=>$GLOBALS['DB_LAST_QUERY_ERRNO'],'errorDescription'=>$GLOBALS['DB_LAST_QUERY_ERROR'],'file'=>__FILE__,'line'=>__LINE__);}sqlite3_close($db);}
		return $user;
	}
	function users_remove($userMail,$db = false){
		if(!preg_match('/^[a-z0-9\._\+\-]+@[a-z0-9\.\-]+\.[a-z]{2,6}$/',$userMail)){return array('errorDescription'=>'EMAIL_ERROR','file'=>__FILE__,'line'=>__LINE__);}

		//FIXME: usar deleteWhere
		$shouldClose = false;if(!$db){$db = sqlite3_open($GLOBALS['api']['users']['db']);sqlite3_exec('BEGIN',$db);$shouldClose = true;}
		$GLOBALS['DB_LAST_QUERY'] = 'DELETE FROM '.$GLOBALS['api']['users']['table'].' WHERE userMail = \''.$userMail.'\';';
		$r = sqlite3_exec($GLOBALS['DB_LAST_QUERY'],$db);
		$changes = $db->changes();
		if($shouldClose){$r = sqlite3_exec('COMMIT;',$db);$GLOBALS['DB_LAST_QUERY_ERRNO'] = $db->lastErrorCode();$GLOBALS['DB_LAST_QUERY_ERROR'] = $db->lastErrorMsg();if(!$r){sqlite3_close($db);return array('errorCode'=>$GLOBALS['DB_LAST_QUERY_ERRNO'],'errorDescription'=>$GLOBALS['DB_LAST_QUERY_ERROR'],'file'=>__FILE__,'line'=>__LINE__);}$r = sqlite3_cache_destroy($db,$GLOBALS['api']['users']['table']);sqlite3_close($db);}
		if(!$changes){return array('errorDescription'=>'USER_NOT_FOUND','file'=>__FILE__,'line'=>__LINE__);}

		//FIXME: si existe la carpeta de usuario, debemos eliminarla tb
		$userFolder = '../db/users/'.$userMail;
		if(file_exists($userFolder)){

		}

		return true;
	}
	function users_remove1($id = false,$db = false){
		$id = preg_replace('/[^0-9]*/',$id);if(!$id){return array('errorDescription'=>'EMAIL_ERROR','file'=>__FILE__,'line'=>__LINE__);}

		$shouldClose = false;if(!$db){$db = sqlite3_open($GLOBALS['api']['users']['db']);sqlite3_exec('BEGIN',$db);$shouldClose = true;}
		$r = sqlite3_deleteWhere($GLOBALS['api']['users']['table'],'(id = '.$id.')',array('db'=>$db));
		if($shouldClose){$r = sqlite3_close($db,true);if(!$r){return array('errorCode'=>$GLOBALS['DB_LAST_QUERY_ERRNO'],'errorDescription'=>$GLOBALS['DB_LAST_QUERY_ERROR'],'file'=>__FILE__,'line'=>__LINE__);}}
		if(!$GLOBALS['DB_LAST_QUERY_CHANG']){return array('errorDescription'=>'USER_NOT_FOUND','file'=>__FILE__,'line'=>__LINE__);}

		//FIXME: si existe la carpeta de usuario, debemos eliminarla tb
		$userFolder = $GLOBALS['api']['users']['dir.users'].$id;
		if(file_exists($userFolder)){

		}

		return true;
	}
	function users_update($userMail,$data = array(),$db = false){
		include_once('inc.strings.php');
		if(isset($data['userBirth_day']) && isset($data['userBirth_month']) && isset($data['userBirth_year'])){$data['userBirth'] = $data['userBirth_year'].'-'.$data['userBirth_month'].'-'.$data['userBirth_day'];unset($data['userBirth_year'],$data['userBirth_month'],$data['userBirth_day']);}
		$valid = array('userName'=>0,'userBirth'=>0,'userPass'=>0,'userGender'=>0,'userNick'=>0,'userModes'=>0,'userStatus'=>0,'userCode'=>0,'userIP'=>0,'userLastLogin'=>0);
		foreach($data as $k=>$v){if(!isset($valid[$k])){unset($data[$k]);continue;}$data[$k] = strings_UTF8Encode($v);}
		$data['_userMail_'] = $userMail;

		/* VALIDATION */
		if(isset($data['userName'])){$data['userName'] = preg_replace('/[^a-zA-ZáéíóúñÁÉÍÓÚÑ, ]*/','',strings_UTF8Encode($data['userName']));}
		if(isset($data['userPass'])){$data['userPass'] = sha1($data['userPass']);}
		if(isset($data['userBirth'])){$data['userBirth'] = preg_replace('/[^0-9\-]*/','',$data['userBirth']);}
		if(isset($data['userBirth']) && (!preg_match('/^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/',$data['userBirth']) || strtotime($data['userBirth']) < 1)){return array('errorDescription'=>'USERBIRTH_ERROR','file'=>__FILE__,'line'=>__LINE__);}
		if(isset($data['userLat']) || isset($data['userLng'])){$data['userLocationUpdated'] = time();}
		if(isset($data['userNick'])){$data['userNick'] = preg_replace('/[^a-zA-Z0-9_\.]*/','',$data['userNick']);$data['userNick'] = strtolower($data['userNick']);if(strlen($data['userNick']) < 4){return array('errorDescription'=>'NICK_TOO_SHORT','file'=>__FILE__,'line'=>__LINE__);}}

		$shouldClose = false;if(!$db){$db = sqlite3_open($GLOBALS['api']['users']['db']);sqlite3_exec('BEGIN',$db);$shouldClose = true;}
		$r = sqlite3_insertIntoTable($GLOBALS['api']['users']['table'],$data,$db);
		if(!$r['OK']){if($shouldClose){sqlite3_close($db);}return array('errorCode'=>$r['errno'],'errorDescription'=>$r['error'],'file'=>__FILE__,'line'=>__LINE__);}
		$user = users_getSingle('(userMail = \''.$data['_userMail_'].'\')',array('db'=>$db));
		if($shouldClose){$r = sqlite3_exec('COMMIT;',$db);$GLOBALS['DB_LAST_QUERY_ERRNO'] = $db->lastErrorCode();$GLOBALS['DB_LAST_QUERY_ERROR'] = $db->lastErrorMsg();if(!$r){sqlite3_close($db);return array('errorCode'=>$GLOBALS['DB_LAST_QUERY_ERRNO'],'errorDescription'=>$GLOBALS['DB_LAST_QUERY_ERROR'],'file'=>__FILE__,'line'=>__LINE__);}sqlite3_close($db);}
		if(isset($GLOBALS['user']) && $GLOBALS['user']['userMail'] == $userMail){$GLOBALS['user'] = $_SESSION['user'] = $user;}
		return $user;
	}
	function users_getSingle($whereClause = false,$params = array()){if(!isset($params['db.file'])){$params['db.file'] = $GLOBALS['api']['users']['db'];}if(!isset($params['indexBy'])){$params['indexBy'] = 'userMail';}return sqlite3_getSingle($GLOBALS['api']['users']['table'],$whereClause,$params);}
	function users_getWhere($whereClause = false,$params = array()){if(!isset($params['db.file'])){$params['db.file'] = $GLOBALS['api']['users']['db'];}if(!isset($params['indexBy'])){$params['indexBy'] = 'userMail';}return sqlite3_getWhere($GLOBALS['api']['users']['table'],$whereClause,$params);}
	function users_getByIDs($userIDs = false,$params = array()){
		if(!isset($params['indexBy'])){$params['indexBy'] = 'id';}
		$whereClause = 1;
		if(is_array($userIDs)){$whereClause = '(id IN ('.implode(',',$userIDs).'))';}
		return users_getWhere($whereClause,$params);
	}
	function users_getByMails($userMails = array(),$db = false){
		$shouldClose = false;if(!$db){$db = sqlite3_open($GLOBALS['api']['users']['db'],SQLITE3_OPEN_READONLY);$shouldClose = true;}
		if(is_string($userMails)){$userMails = preg_replace($GLOBALS['api']['users']['reg.mail.clear'],'',$userMails);$r = users_getSingle('(userMail = \''.$userMails.'\')',array('db'=>$db));if($shouldClose){sqlite3_close($db);}return $r;}
		if(is_array($userMails)){
//FIXME: TODO
}
		if($shouldClose){sqlite3_close($$db);}
		return $r;
	}
	/* To improve security better use a true random function, good enought fot now but somewhat predictable */
	function users_helper_generateCode($userMail){$userCode = sha1($userMail.time().date('Y-m-d H:i:s'));return $userCode;}
	function users_login($userMail,$userPass,$db = false){
		if(empty($userMail)){return false;}
		$userPass = sha1($userPass);

		$shouldClose = false;if($db == false){$db = sqlite3_open($GLOBALS['api']['users']['db']);$shouldClose = true;}
		$user = users_getSingle('(userMail = \''.$db->escapeString($userMail).'\' AND userPass = \''.$db->escapeString($userPass).'\')',array('db'=>$db));
		if(!$user){if($shouldClose){sqlite3_close($db);}return array('errorDescription'=>'WRONG_USER_OR_PASS','file'=>__FILE__,'line'=>__LINE__);}
		/* Puede que el usuario no esté confirmado, en dicho caso no se permite loguear */
		if(!isset($user['userStatus']) || empty($user['userStatus'])){if($shouldClose){sqlite3_close($db);}return array('errorCode'=>1,'errorDescription'=>'USER_NOT_ACTIVE','file'=>__FILE__,'line'=>__LINE__);}
		$newCode = users_helper_generateCode($userMail);
		$user = users_update($db->escapeString($userMail),array('userIP'=>$_SERVER['REMOTE_ADDR'],'userLastLogin'=>time(),'userCode'=>$newCode),$db,true);
		if($shouldClose){sqlite3_close($db);}
		if(isset($user['errorDescription'])){return $user;}
		setcookie('u',$user['userCode'],time()+360000,'/');
		$_SESSION['user'] = $GLOBALS['user'] = $user;
		return $user;
	}
	function users_logout(){
		session_destroy();
		setcookie('u','',-1,'/');
	}
	function users_isLogged($db = false){
		if(isset($GLOBALS['user']) && is_array($GLOBALS['user'])){return true;}
		if(isset($_SESSION['user']) && is_array($_SESSION['user'])){$GLOBALS['user'] = $_SESSION['user'];$GLOBALS['userPath'] = '../db/users/'.$_SESSION['user']['userMail'].'/';return true;}
		if(isset($_COOKIE['u']) && strlen($_COOKIE['u']) == 40){
			$_COOKIE['u'] = preg_replace('/[^0-9a-zA-Z]*/','',$_COOKIE['u']);
			$user = users_getSingle('(userIP = \''.$_SERVER['REMOTE_ADDR'].'\' AND userCode = \''.$_COOKIE['u'].'\')',array('db'=>$db));
			if(!$user){setcookie('u','',-1,'/');return false;}
			$_SESSION['user'] = $GLOBALS['user'] = $user;
			return true;
		}
		return false;
	}
	function users_checkModes($mode){
		if(!isset($GLOBALS['user'])){return false;}
		return (strpos($GLOBALS['user']['userModes'],','.$mode.',') !== false);
	}

	function users_search($searchString = '',$db = false){
		$shouldClose = false;if(!isset($db) || !$db){$db = sqlite3_open($GLOBALS['api']['users']['db'],SQLITE3_OPEN_READONLY);$shouldClose = true;}
		$user = users_getSingle('(userMail = \''.$db->escapeString($searchString).'\')',array('db'=>$db));
		if($user){if($shouldClose){sqlite3_close($db);}return array($user['userMail']=>$user);}

		$searchString = preg_replace('/[^0-9a-zA-ZáéíóúÁÉÍÓÚ ]*/','',$searchString);
		if(!strpos($searchString,' ')){
			$searchStringEscaped = $db->escapeString($searchString);
			$users = users_getWhere('(userName LIKE \'%'.$searchStringEscaped.'%\' OR userMail LIKE \'%'.$searchStringEscaped.'%\')',array('db'=>$db));
			if($shouldClose){sqlite3_close($db);}
			return $users;
		}

		/* Comparing anonymus function */
		$o = function($a,$b){if ($a['searchRate'] == $b['searchRate']){return 0;}return ($a['searchRate'] > $b['searchRate']) ? -1 : 1;};

		$letterLimit = 3;
		$searchArray = array_unique(explode(' ',$searchString));
		$searchArrayCount = count($searchArray);
		$searchQueryOR = $searchQueryAND = '(';foreach($searchArray as $element){
			/* Si solo hay una palabra debemos buscar por ella aunque solo tenga 3 letras */
			if(strlen($element) <= $letterLimit && $searchArrayCount > 1){continue;}
			$escapedElement = $db->escapeString($element);
			$searchQueryOR .= '(userName LIKE \'%'.$escapedElement.'%\') OR ';
			$searchQueryAND .= '(userName LIKE \'%'.$escapedElement.'%\') AND ';
		}
		$totalStars = count($searchArrayCount);
		$searchQueryOR = substr($searchQueryOR,0,-4).')';
		$searchQueryAND = substr($searchQueryAND,0,-4).')';

		$usersA = users_getWhere($searchQueryAND,array('db'=>$db));
		$usersO = users_getWhere($searchQueryOR,array('db'=>$db));

		/* El valor de $i es decremental porque se estima que las palabras que aparezcan antes en el
		 * criterio de búsqueda tienen más peso */
		if($usersO){
			foreach($usersO as $k=>$user){$i = $totalStars;$usersO[$k]['searchRate'] = 0;foreach($searchArray as $searchItem){$ret = strpos(strtolower($user['userName']),strtolower($searchItem));if($ret !== false){$usersO[$k]['searchRate'] += $i;}$i--;}}
			uasort($usersO,$o);
		}
		if($shouldClose){sqlite3_close($db);}
		return array_merge($usersA,$usersO);
	}

	function users_avatar_save($userID = '',$filePath = ''){
		include_once('inc.images.php');
		$res = image_getResource($filePath);if(!$res){return array('errorDescription'=>'NOT_AN_IMAGE','file'=>__FILE__,'line'=>__LINE__);}
		$userPath = $GLOBALS['api']['users']['dir.users'].$userID.'/avatar/';
		if(!file_exists($userPath)){$oldmask = umask(0);$r = @mkdir($userPath,0777,1);umask($oldmask);}
		$origPath = $userPath.'orig';
		$oldmask = umask(0);
		$r = @rename($filePath,$origPath);

		/* Salvamos la imagen original en png y jpeg */
		$r = image_convert($origPath,'jpeg');
		$r = image_convert($origPath,'png');
		/* Realizamos los diferentes tamaños */
		$sizes = array('32','64','128','256','306');$overWrite = true;
		foreach($sizes as $k=>$size){
			$destPath = $userPath.$size.'.jpeg';
			if($overWrite === false && file_exists($destPath)){continue;}
			if(!is_numeric($size[0])){unset($sizes[$k]);continue;}
			if(strpos($size,'x') !== false){$r = image_thumb($res,$destPath,$size);continue;}
			$r = image_square($res,$destPath,$size);
		}
		umask($oldmask);

		imagedestroy($res);
		return true;
	}

	function users_getPath($userID = false,$path = '',$shouldCreate = false){
		$userPath = $GLOBALS['api']['users']['dir.users'].$userID.'/';
		if(!file_exists($userPath)){$oldmask = umask(0);$r = @mkdir($userPath,0777,1);umask($oldmask);}
		$userPath .= $path;if(substr($userPath,-1) !== '/'){$userPath .= '/';}
		if($shouldCreate && !file_exists($userPath)){$oldmask = umask(0);$r = @mkdir($userPath,0777,1);umask($oldmask);}
		return $userPath;
	}

	function users_updateSchema($db = false){
		include_once('inc.sqlite3.php');
		$shouldClose = false;if($db == false){$db = sqlite3_open($GLOBALS['api']['users']['db']);$shouldClose = true;}
		$r = sqlite3_updateTableSchema($GLOBALS['api']['users']['table'],$db,'userMail');
		if($shouldClose){sqlite3_close($db);}
		return true;
	}
?>
