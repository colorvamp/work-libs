<?php
	if(!defined('T')){define('T',"\t");}
	if(!defined('N')){define('N',"\n");}

	function html_petition($url,$data = false){
		$GLOBALS['PROC_LAST_OP'] = 'Petition to "'.$url.'"';

		$context = stream_context_create();
		$uinfo = parse_url(trim($url));
		$port = 80;$scheme = 'tcp';
		if(!isset($uinfo['scheme'])){return array('pageHeader'=>'HTTP/1.1 400 BAD REQUEST','pageContent'=>'');}
		if($uinfo['scheme'] == 'https'){
			$scheme = 'ssl';$port = 443;
			$r = stream_context_set_option($context,'ssl','verify_host',true);
			$r = stream_context_set_option($context,'ssl','allow_self_signed',true);
		}
		if(!isset($uinfo['path'])){$uinfo['path'] = '/';}
		$fp = @stream_socket_client($scheme.'://'.$uinfo['host'].':'.$port,$errno,$errstr,10,STREAM_CLIENT_CONNECT,$context);
		if(!$fp){
			if($errno == 110){return array('pageHeader'=>'HTTP/1.1 001 TIMEOUT','pageContent'=>'');}
			echo $errstr.' ('.$errno.')';return false;
		}
		$CR = "\r\n";

		$header = (isset($data['post']) ? 'POST' : 'GET').' '.$uinfo['path'].((isset($uinfo['query']) && !empty($uinfo['query'])) ? '?'.$uinfo['query'] : '').' HTTP/1.1'.$CR.
		'Host: '.$uinfo['host'].$CR.
		'User-Agent: '.'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:22.0) Gecko/20130328 Firefox/22.0'.$CR.
		'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'.$CR.
		'Accept-Language: en-uk,en;q=0.8,en-US:q=0.5,en;q=03'.$CR.
		'Accept-Encoding: gzip,deflate'.$CR.
		'Connection: Close'.$CR.
		(isset($data['referer']) ? 'Referer: '.$data['referer'].$CR : '').
		(isset($data['header']) ? implode($CR,     array_map(function($n,$m){return $n.': '.$m;},array_keys($data['header']),array_values($data['header']))     ).$CR : '').
		'';

		if(isset($data['cookies']) && count($data['cookies']) > 0){
			$cookieData = '';foreach($data['cookies'] as $cookie){list($key,$value) = each($cookie);$cookieData .= $key.'='.$value.'; ';}
			if($cookieData == ''){$cookieData = substr($cookieData,0,-2);}
			$header .= 'Cookie: '.$cookieData.$CR;
		}

		if(isset($data['post'])){
			$postData = http_build_query($data['post']);
			$header .= 'Content-Type: application/x-www-form-urlencoded'.$CR.
			'Content-Length: '.strlen($postData).$CR;
			unset($data['post']);
		}

		$header .= $CR;
		if(isset($postData)){$header .= $postData;}
//print_r($header)."\n\n\n\n";

		$u = fwrite($fp,$header);
		if($u === false){echo 'Unable to write';return false;}
		$buffer = '';while(!feof($fp)){$buffer .= fgets($fp,1024);}fclose($fp);
		$break = strpos($buffer,$CR.$CR)+4;
		$header = substr($buffer,0,$break);
		$content = substr($buffer,$break);
		unset($buffer);
		if(strpos(strtolower($header),'transfer-encoding: chunked') !== false){$content = html_unchunkHttp11($content);}
		if(strpos(strtolower($header),'transfer-encoding:  chunked') !== false){$content = html_unchunkHttp11($content);}
		if(strpos(strtolower($header),'content-encoding: gzip') !== false){$content = gzdecode($content);}

		/* Salvando cookies */
		//FIXME: necesitamos ponerle domain
		$cookies = array();$m = preg_match_all('/Set-Cookie: (.*)/',$header,$arr);
		if($m){foreach($arr[0] as $k=>$v){
			$cookie = array();$m = preg_match_all('/([a-zA-Z0-9\-_\.]*)=([^;]+)/',$arr[1][$k],$c);foreach($c[0] as $k=>$v){$cookie[$c[1][$k]] = $c[2][$k];}$cookies[] = $cookie;
		}}
		if(isset($data['cookies'])){$cookies = array_merge($data['cookies'],$cookies);}
		$data['cookies'] = $cookies;
		//print_r($cookies);exit;

		/* Follow Location */
		$m = preg_match('/Location: (.*)/',$header,$arr);
		if($m && isset($data['followLocation']) && $data['followLocation'] === true){
			$uri = $arr[1];if(substr($uri,0,4) != 'http'){$uri = $uinfo['scheme'].'://'.$uinfo['host'].((strpos($arr[1],0,1) == '/') ? '' : '/').$arr[1];}
			return html_petition($uri,$data);
		}

		return array('currentURL'=>$url,'pageHeader'=>$header,'pageContent'=>$content,'cookies'=>$cookies);
	}
	function html_unchunkHttp11($data){
		$fp = 0;$outData = '';$CR = "\r\n";
		while($fp < strlen($data)){$rawnum = substr($data,$fp,strpos(substr($data,$fp),$CR)+2);$num = hexdec(trim($rawnum));$fp += strlen($rawnum);$chunk = substr($data,$fp,$num);$outData .= $chunk;$fp += strlen($chunk);}
		return $outData;
	}
	if(!function_exists('gzdecode')){function gzdecode($data){return gzinflate(substr($data,10,-8));}}
	function gzdecode2($data){$g = tempnam('/tmp','ff');@file_put_contents($g,$data);ob_start();readgzfile($g);$d = ob_get_clean();unlink($g);return $d;}
?>
