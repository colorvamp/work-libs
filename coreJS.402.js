	function extend(destination,source){for(var property in source){destination[property] = source[property];}return destination;}
	function $_(id,obj,holder){var el = document.getElementById(id);if(!el){return null;}if(obj){for(var o in obj){if(o.indexOf('.')==0){el.style[o.replace(/^./,'')] = obj[o];continue;}el[o] = obj[o];}}if(holder){holder.appendChild(el);}return $fix(el);}
	function $fix(elem,obj,holder){
		elem = extend(elem,{
			$T: function(tag){ return this.getElementsByTagName(tag); },
			$B: function(obj){for(var o in obj){if(o.indexOf('.')==0){this.style[o.replace(/^./,'')] = obj[o];continue;}this[o] = obj[o];}return this;},
			$L: function(c){ return this.getElementsByClassName(c); },
			$P: function(p){return $E.parent.find(this,p);},
			empty: function(){while(this.firstChild){this.removeChild(this.firstChild);}return this;},
			isChildNodeOf: function(parent){var isChild = false;var child = this;while(child.parentNode && !isChild){if(child.parentNode == parent){var isChild = true;continue;}child = child.parentNode;}return isChild;},
			outerHeight: function(){var s = window.getComputedStyle(this,null);return (this.offsetHeight/*+parseInt(s.paddingTop)+parseInt(s.paddingBottom)*/);},
			innerHeight: function(){var s = window.getComputedStyle(this,null);return (this.offsetHeight-parseInt(s.paddingTop)-parseInt(s.paddingBottom)-parseInt(s.borderTopWidth)-parseInt(s.borderBottomWidth));},
			outerWidth: function(){var s = window.getComputedStyle(this,null);return (this.offsetWidth/*+parseInt(s.paddingLeft)+parseInt(s.paddingRight)*/);},
			innerWidth: function(){var s = window.getComputedStyle(this,null);return (this.offsetWidth-parseInt(s.paddingLeft)-parseInt(s.paddingRight)-parseInt(s.borderLeftWidth)-parseInt(s.borderRightWidth));}
		});
		if(obj){for(var o in obj){if(o.indexOf('.')==0){elem.style[o.replace(/^./,'')] = obj[o];continue;}elem[o] = obj[o];}}
		if(holder){holder.appendChild(elem);}
		return elem;
	}
	function $A(iterable){
		if(!iterable){return [];}
		if(iterable.toArray){return iterable.toArray();}
		var length = iterable.length || 0, results = new Array(length);
		while (length--) results[length] = iterable[length];
		results = extend(results,{
			append:function(arr){for(var a=0; a<arr.length; a++){this.push(arr[a]);}return this;},
			remove: function(elem){for(var i=0; i<this.length; i++){if(this[i]==elem){this.splice(i,1);}};},
			each: function(fun){for(var i=0; i<this.length; i++){fun.call(this,this[i],i);}},
			empty: function(){this.splice(0,this.length);return this;},
			find: function(elem){for(var i=0; i<this.length; i++){if(this[i]==elem){return i;}};return -1;},
			cleanEmptyValues: function(){for(var i=0; i<this.length; i++){if(this[i]==''){this.splice(i,1);}};return this;},
			values: function(){var r = [];for(var i=0; i<this.length; i++){r.push(this[i]);}return r;}
		});
		return results;
	}
	function $C(tag,obj,holder){var el = document.createElement(tag);return $fix(el,obj,holder);}
	function $T(tag,elem){if(elem){return elem.getElementsByTagName(tag);}return document.getElementsByTagName(tag);}
	/* extended $E-lements functions - to avoid too much selector overload */
	var $E = {
		classHas: function(elem,className){var p = new RegExp('(^| )'+className+'( |$)');return (elem.className && elem.className.match(p));},
		classAdd: function(elem,className){if($E.classHas(elem,className)){return true;}elem.className += ' '+className;},
		classRemove: function(elem,className){var c = elem.className;var p = new RegExp('(^| )'+className+'( |$)');c = c.replace(p,' ').replace(/  /g,' ');elem.className = c;},
		classParentHas: function(elem,className,limit){
			limit = typeof limit !== 'undefined' ? limit : 1;
			if($E.classHas(elem,className)){return elem;}
			if(!elem.parentNode){return false;}
			do{if($E.classHas(elem.parentNode,className)){return elem.parentNode;}elem = elem.parentNode;}while(elem.parentNode && limit--);return false;
		},
		class: {
			exists: function(elem,className){var p = new RegExp('(^| )'+className+'( |$)');return (elem.className && elem.className.match(p));},
			add: function(elem,className){if($E.classHas(elem,className)){return true;}elem.className += ' '+className;},
			remove: function(elem,className){var c = elem.className;var p = new RegExp('(^| )'+className+'( |$)');c = c.replace(p,' ').replace(/  /g,' ');elem.className = c;}
		},
		parent: {
			find: function(elem,p){/* p = {tagName:false,className:false} */if(p.tagName){p.tagName = p.tagName.toUpperCase();}if(p.className){p.className = new RegExp('( |^)'+p.className+'( |$)');}while(elem.parentNode && ((p.tagName && elem.tagName!=p.tagName) || (p.className && !elem.className.match(p.className)))){elem = elem.parentNode;}if(!elem.parentNode){return false;}return $fix(elem);}
		}
	}
	/* extended $F-unctions functions */
	var $F = {
		find: function(l,pool){if(!pool){pool = window;}var func = pool;var funcSplit = l.split('.');var e = true;for(i = 0;i < funcSplit.length;i++){if(!func[funcSplit[i]]){e = false;break;}func = func[funcSplit[i]];}return e ? func : false;}
	}

	extend(Function.prototype,{
		argumentNames: function(){var names = this.toString().match(/^[\s\(]*function[^(]*\(([^\)]*)\)/)[1].replace(/\s+/g, '').split(',');return names.length == 1 && !names[0] ? [] : names;},
		bind: function(){if(arguments.length < 2 && typeof(arguments[0]) == 'undefined'){return this};var __method = this, args = $A(arguments), object = args.shift();return function(){return __method.apply(object, args.concat($A(arguments)));}}
	});

	function $capitalize(str){return str.replace(/\w+/g,function(a){return a.charAt(0).toUpperCase()+a.slice(1).toLowerCase();});}
	function $clone(obj){if(obj == null || typeof(obj) != 'object'){return obj;}var temp = obj.constructor();for(var key in obj){temp[key] = $clone(obj[key]);}return temp;}
	function $execWhenExists(funcName,params){
//FIXME: deberia ser var para que solo estuviera disponible localmente
		$findFunc = function(l,pool){if(!pool){pool = window;}var func = pool;var funcSplit = l.split('.');var e = true;for(i = 0;i < funcSplit.length;i++){if(!func[funcSplit[i]]){e = false;break;}func = func[funcSplit[i]];}return e ? func : false;}
		if(func = $findFunc(funcName)){func.apply(func,params);return true;}
		var l = 'launcher_'+funcName;var body = document.body;if(body[l]){return false;}
		body[l] = setInterval(function(){if(func = $findFunc(funcName)){clearInterval(body[l]);func.apply(func,params);return true;}},200);
	}
	function $execWhenTrue(e,func){
		/*if($T("BODY")[0].l){return;}*/var a = eval(e);
		if(!a){var l = "launcher_"+e+Math.floor(Math.random()*10000);$T("BODY")[0][l] = window.setInterval(function(){var a = eval(e);if(a){func();window.clearInterval($T("BODY")[0][l]);}},100);
		}else{func();}
	}
	function $each(obj,fun){
		if(Array.isArray(obj) || $type(obj.length) === 'number'){for(var i=0; i<obj.length; i++){fun.call(this,i,obj[i],i);};return;}
		if($type(obj)=='object'){var n=0;for(var a in obj){fun.call(this,a,obj[a],n);n++;}return;}
	}
	function $getElementStyle(obj,styleProp){if(obj.currentStyle){return obj.currentStyle[styleProp];}if(window.getComputedStyle){return document.defaultView.getComputedStyle(obj,null).getPropertyValue(styleProp);}}
	function $getOffsetLeft(el){var ol = 0;while(el.parentNode){ol += el.offsetLeft+parseInt($getElementStyle(el,'padding-left'));el = el.parentNode;}return ol;}
	function $getOffsetTop(el){var ot = 0;while(el.parentNode){ot += el.offsetTop+parseInt($getElementStyle(el,'padding-top'));el = el.parentNode;}return ot;}
	function $getOffsetPosition(el){return el.getBoundingClientRect();}
	function $htmlEntitiesDecode(html){if(!html){return "";}return html.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">");};
	function $htmlEntitiesEncode(html){if(!html){return "";}return html.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\\/g,"");};
	function $parseForm(f,e){var ops = {};$A(f.$T('INPUT')).append(f.$T('TEXTAREA')).append(f.$T('SELECT')).each(function(el){if(el.type=='checkbox'){ops[el.name] = el.checked;return;}if(el.type=='radio' && !el.checked){return;}ops[el.name] = (!e) ? el.value : encodeURIComponent(el.value);});return ops;}
	function $reAltElements(el){var alt = '';$A(el.childNodes).each(function(c){c.className = c.className.replace(/[ ]*alt[ ]*/,'')+alt;alt = (alt == '') ? ' alt':'';});el.alt = alt;}
	function $round(num){num = num.toString();if(num.indexOf('.') == -1){return num;}num = (parseFloat(num)*1000).toString().split('.')[0];if(parseInt(num[num.length-1])>4){if(num[0]!='-'){num = (parseInt(num)+10).toString();}else{num = (parseInt(num)-10).toString();}}num = (parseInt(num)/10).toString();num = num.split('.')[0];num = (parseInt(num)/100).toString();return num;}
	function $toUrl(elem){var str = '';for(var a in elem){str += a+'='+encodeURIComponent(elem[a].toString())+'&';}return str.replace(/&$/,'');}
	function $type(obj){return typeof(obj);}
	var $is = {
		empty: function(o){if(!o || ($is.string(o) && o == '') || ($is.array(o) && !o.length)){return true;}return false;},
		array: function(o){return (Array.isArray(o) || $type(o.length) === 'number');},
		string: function(o){return (typeof o == 'string' || o instanceof String);},
		object: function(o){return (o.constructor.toString().indexOf('function Object()') == 0);},
		element: function(o){return ('nodeType' in o && o.nodeType === 1 && 'cloneNode' in o);},
		function: function(o){return (o.constructor.toString().indexOf('function Function()') == 0);},
		formData: function(o){return (o.constructor.toString().indexOf('function FormData()') == 0);}
	};
	var $json = {
		encode: function(obj){if(JSON.stringify){return JSON.stringify(obj);}},
		decode: function(str){
			if($is.empty(str)){return {errorDescription:"La cadena está vacía, revise la API o el COMANDO"};}
			if(!$is.string(str)){return {errorDescription:'JSON_ERROR'};}
			if(str.match("<title>404 Not Found</title>")){return {errorDescription:"La URL de la API es errónea: 404"};}
			if(!JSON || !JSON.parse){return eval('('+str+')');}
			try{return JSON.parse(str);}catch(err){return {errorDescription:str};}
		}
	};

	//FIXME: DEPRECATED: usar $is.empty
	function isEmpty(elem){if(!elem || elem == ""){return true;}return false;}
	function print_r(obj,i){
		var s="";if(!i){i = "    ";}else{i += "    ";}
		if(obj.constructor == Array || obj.constructor == Object){
			for(var p in obj){
				if(!obj[p]){s += i+"["+p+"] => NULL\n";continue;};
				if(obj[p].constructor == Array || obj[p].constructor == Object){
					var t = (obj[p].constructor == Array) ? "Array" : "Object";
					s += i+"["+p+"] => "+t+"\n"+i+"(\n"+print_r(obj[p],i)+i+")\n";
				}else{s += i+"["+p+"] => "+obj[p]+"\n";}
			}
		}
		return s;
	}
	function jsonEncode(obj){if(JSON.stringify){return JSON.stringify(obj);}}
	function jsonDecode(str){
		if(isEmpty(str)){return {errorCode:999,errorDescription:"La cadena está vacía, revise la API o el COMANDO"};}
		if(str.match("<title>404 Not Found</title>")){return {errorCode:999,errorDescription:"La URL de la API es errónea: 404"};}
		if(!JSON || !JSON.parse){return eval("("+str+")");}
		try{return JSON.parse(str);}catch(err){return {errorCode:999,errorDescription:str};}
	}
	function jsonClassEncode(obj){
		var s='';
		if(obj.constructor == Array){s+='['};
		if(obj.constructor == Object){s+='{'};
		for(var p in obj){
			if(!obj[p]){s += "'"+p+"':NULL,";continue;};
			if(obj[p] == "[object HTMLDivElement]" && !isEmpty(obj[p].id)){obj[p] = "$_('"+obj[p].id+")";}
			if(obj[p].constructor == Array || obj[p].constructor == Object){s+="'"+p+"':"+jsonClassEncode(obj[p])+",";}
			else{s += "'"+p+"':"+JSON.stringify(obj[p].toString())+",";}
		}
		s = s.replace(/,$/,'');
		if(obj.constructor == Array){s+=']'};
		if(obj.constructor == Object){s+='}'};
		return s;
	}
	/*==INI-INCLUDE-FILES==*/
	function include_once(file,type){
		/* type = (css || js) */
		if(type){var ext = type;}else{/**/var ext = file.match(/(css|js)$/);if(!ext){return;}else{ext = ext[1];}/**/}
		var fileType = ext.replace(/js/i,'script').replace(/css/i,'link');
		var baseName = file.match(/[^\/]*$/);
		var included = false;
		$A($fix($T('HEAD')[0]).$T(fileType.toUpperCase())).each(function(elem){/**/if((elem.src && elem.src == file) || (elem.href && elem.href == file)){included=true;}/**/});
		if(!included){window["include"+ext.toUpperCase()](file);}
	}
	function includeJS(file){return $C('SCRIPT',{'src':file,'type':'text/javascript'},$T('head')[0]);}
	function includeCSS(file){return $C('LINK',{href:file,rel:'stylesheet',type:'text/css'},$T('head')[0]);}
	/*==END-INCLUDE-FILES==*/

	/*==INI-COOKIE-MANAGEMENT==*/
	function cookieTake(cookieName){var value = document.cookie.match('(?:^|;)\\s*' + cookieName.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1') + '=([^;]*)');return cookieName =  value ? value[1] : value;}
	function cookieSet(cookieName,value,expDays){var exdate = new Date();exdate.setDate(exdate.getDate()+expDays);document.cookie = cookieName+"="+escape(value)+((expDays==null) ? "" : ";expires="+exdate.toGMTString());}
	function cookieRemove(cookieName){document.cookie = cookieName+"=;expires=Thu, 01-Jan-1970 00:00:01 GMT";}
	function cookiesToObj(){
		var cookies = document.cookie.replace(/;[ ]?/g,";").split(";");if(isEmpty(cookies)){return {};}
		var obj = {};$A(cookies).each(function(elem){elem = elem.match(/([^=]*)=(.*)/);obj[unescape(elem[1])]=unescape(elem[2]);});return obj;
	}
	function cookiesToArr(){
		var cookies = document.cookie.replace(/;[ ]?/g,";").split(";");if(isEmpty(cookies)){return [];}
		var arr = [];$A(cookies).each(function(elem){elem = elem.match(/([^=]*)=(.*)/);arr.push({cookieName:unescape(elem[1]),cookieValue:unescape(elem[2])});});return arr;
	}
	/*==END-COOKIE-MANAGEMENT==*/


	function ajaxPetition(url,params,callback){
		//if(!url){return;}if(!params){params = '';}
		var method = 'GET';if(url.match(/\.php$/) || params !== ''){method = 'POST';}

		var rnd = Math.floor(Math.random()*10000);
		var ajax = new XMLHttpRequest();
//FIXME:quizá con extend?
		ajax.open(method,url+'?rnd='+rnd,true);
		ajax.onreadystatechange=function(){if(ajax.readyState==4){callback(ajax);return;}}
		ajax.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
		ajax.send(params);
	}
	function $ajax(url,params,callbacks){
		var method = 'GET';if(params){method = 'POST';}
		var rnd = Math.floor(Math.random()*10000);
		var data = false;
		if(params){switch(true){
			case ($is.object(params)):data = new FormData();$each(params,function(k,v){data.append(k,v);});break;
			default:data = params;
		}}

		var xhr = new XMLHttpRequest();
		xhr.open(method,url+'?rnd='+rnd,true);
		xhr.onreadystatechange = function(){
			if(callbacks.onEnd && xhr.readyState == XMLHttpRequest.DONE){return callbacks.onEnd(xhr.responseText);}
		}
		if(!$is.formData(data)){xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');}
		xhr.send(data);

		if(callbacks.onUpdate){var offset = 0;var timer = setInterval(function(){
			if(xhr.readyState == XMLHttpRequest.DONE){clearInterval(timer);}
			var text = xhr.responseText.substr(offset);
			if(!$is.empty(text)){var cmds = text.split("\n");$each(cmds,function(k,v){
				if($is.empty(v)){return false;}
				callbacks.onUpdate(v);
			});}
			offset = xhr.responseText.length;
		},1000);}
	}

	var VAR_schedules = Object();
	var VAR_schedulerRun = false;
	var VAR_schedulerDelay = 10000;
	function schedulerAdd(funcName,func){VAR_schedules[funcName] = func;}
	function schedulerExec(){if(!VAR_schedulerRun){return;}for(var a in VAR_schedules){VAR_schedules[a]();}}
	function schedulerRun(st){VAR_schedulerRun = st ? true : false;}
	function schedulerRestart(){clearInterval(window.scheduler);window.scheduler = setInterval(schedulerExec,VAR_schedulerDelay);}
	window.scheduler = setInterval(schedulerExec,VAR_schedulerDelay);

	var VAR_wodInfo = {zIndex:40,marginRight:1};
	function info_create(id,style,holder,indicatorOffsetLeft){
		var prev = $_('info_'+id);if(prev){if(holder){holder.appendChild(prev);}return prev;}
		if(!style){var style = {};}var className = 'wodInfo';if(style.className){className += ' '+style.className;}
		extend(style,{'id':'info_'+id,'className':className,'.zIndex':VAR_wodInfo.zIndex++,onclick:function(e){e.stopPropagation();},onmousedown:function(e){e.stopPropagation();},loader:function(t){info_loader(this,t);},transition:function(n){info_transition(this.infoContainer,n);}});
		if(!holder){holder = $T('BODY')[0];}
		/* Si el objetivo es un botón creado con la API, entonces usamos sus propiedades para declararlo activo */
		var gnomeButton = false;if(holder && holder.parentNode && holder.parentNode.className.match(/button/)){var oldClassName = holder.parentNode.className;holder.parentNode.className += ' active';gnomeButton = true;}

		var w = $C('DIV',style,holder);
		var d = w.infoIndicator = $C('DIV',{className:'wodInfoIndicator'},w);
		w.infoContainer = $C('DIV',{className:'wodInfoContainer','infoWindow':w,id:'info_'+id+'_container','.position':'relative'},w);

		if(gnomeButton){w.afterRemove = function(){holder.parentNode.className = oldClassName;}}
		var pos = $getOffsetPosition(w);var rpos = ($T('BODY')[0].offsetWidth)-pos.left-pos.width;
		/* If the infoBox is out the page, fix it to the right border */
		if(rpos < VAR_wodInfo.marginRight){w.style.left = w.offsetLeft+rpos-VAR_wodInfo.marginRight+'px';d.style.left = (Math.abs(w.offsetLeft)-VAR_wodInfo.marginRight)+'px';}
		return w;
	}
	function info_destroy(el,ev){
		while(el.parentNode && el.className!='wodInfo'){el = el.parentNode;}if(!el.parentNode){return;}
		if(el.parentNode.className.match(/ pressed$/)){el.parentNode.className = el.parentNode.className.replace(/ pressed$/,'');}
		var afterRemove = function(){};if(el.afterRemove){afterRemove=el.afterRemove;}
		el.parentNode.removeChild(el);
		if(ev){ev.stopPropagation();}
		afterRemove();
	}
	function info_reflow(w){
		while(w.parentNode && w.className!='wodInfo'){w = w.parentNode;}if(!w.parentNode){return;}
		var i = w.infoIndicator;
		var pos = $getOffsetPosition(w);var rpos = ($T('BODY')[0].offsetWidth)-pos.left-pos.width;
		if(rpos < VAR_wodInfo.marginRight){w.style.left = w.offsetLeft+rpos-VAR_wodInfo.marginRight+'px';i.style.left = (Math.abs(w.offsetLeft)-VAR_wodInfo.marginRight)+'px';}
		return w;
	}
	function info_transition(c,n){
		/* c (current) & n (next) must be type wodInfoContainer */
		var i = c.parentNode;
		i.$B({'.overflow':'hidden'});
		n.$B({'.position':'absolute','.top':'0','.left':'0','.width':c.innerWidth()+'px'/*,'.visibility':'hidden'*/});
		i.appendChild(n);
		i.parentNode.infoContainer = n;
		var oldHeight = c.innerHeight();
		var newHeight = n.innerHeight();
		var on = n.offsetHeight;

		//eEaseHeight(i,newHeight-oldHeight);
		eEaseHeight(i,on,function(el){el.$B({'.height':'100%'});},1250,false,true);
		eFadeout(c,function(el){el.parentNode.removeChild(el);});
		eFadein(n,function(el){el.$B({'.position':'static','.top':'auto','.left':'auto','.width':'auto'});});
	}
	function info_loader(i,t){
		var n = $C('DIV',{className:'wodInfoContainer loading'});
		$C('SPAN',{innerHTML:t},n);
		info_transition(i.infoContainer,n);
	}

	function gnomeButton_create(text,callback,holder,variant){/* DEPRECATED - HOLDER MUST BE UL EVER */
		if(!variant){variant = "gnomeButton";}
		if(holder && holder.tagName == 'UL'){return gnomeButton_create_li(text,callback,holder,variant);}
		var bt = d = $C("DIV",{className:"button "+variant+"Unpressed"});
		bt.buttonContainer = d = $C("DIV",{className:"buttonCenter",innerHTML:text},$C("DIV",{className:"buttonRight"},$C("DIV",{className:"buttonLeft"},d)));
		bt.onmousedown = function(e){e.preventDefault();bt.className = bt.className.replace(variant+"Unpressed",variant+"Pressed");};
		bt.onmouseup = d.onmouseout = function(){bt.className = bt.className.replace(variant+"Pressed",variant+"Unpressed");}
		bt.onclick = function(e){callback(e,bt);};
		if(holder){holder.appendChild(bt);}
		return bt;
	}
	function gnomeButton_create_li(text,callback,holder,variant){
		if(!variant){variant = 'gnomeButton';}
		var bt = $C('LI',{className:'button '+variant,onclick:function(e){callback(e,this);},onmousedown:function(e){e.stopPropagation();}});
		bt.buttonContainer = $C('DIV',{className:'buttonCenter',innerHTML:text},bt);
		if(holder){holder.appendChild(bt);}
		return bt;
	}

	/*==INI-EFFECTS==*/
	function eTweenStart(elem,interval){
		if(!interval){interval=50;}
		if(elem.eTween){window.clearInterval(elem.eTween);}
		elem.eTweenMode = 'decr';
		elem.fvalue = 1.0;
		elem.eTween = window.setInterval(function(){
			if(elem.eTweenMode == 'incr'){fvalue = (parseFloat(elem.fvalue)+0.11)+''.substring(0,3);}
			else{fvalue = (parseFloat(elem.fvalue)-0.11)+''.substring(0,3);}
			if(fvalue>(0.9)){fvalue=1;elem.eTweenMode = 'decr';}
			if(fvalue<(0.1)){fvalue=0;elem.eTweenMode = 'incr';}
			elem.style.opacity = elem.fvalue = fvalue;
		},interval);
	}
	function eTweenStop(elem,interval){
		if(!interval){interval=50;}
		if(elem.eTween){window.clearInterval(elem.eTween);}
		fvalue = parseFloat(elem.fvalue);
		elem.eTween = window.setInterval(function(){
			fvalue = (parseFloat(elem.fvalue)+0.11)+"".substring(0,3);
			if(fvalue>(0.9)){
				fvalue=1;
				elem.style.opacity = elem.fvalue = fvalue;
				window.clearInterval(elem.eTween);
				elem.eTween = false;
			}
			elem.style.opacity = elem.fvalue = fvalue;
		},interval);
	}
	function eFadein(elem,callback,interval){
		if(!interval){interval=50;}
		var fvalue = 0.0;
		if(elem.eFade){window.clearInterval(elem.eFade);elem.eFade = false;fvalue = elem.style.opacity ? elem.style.opacity : 0.0;}
		elem.style.visibility = "visible";
		elem.style.opacity = elem.fvalue = fvalue;
		elem.eFade = window.setInterval(function(){
			fvalue = (parseFloat(elem.fvalue)+0.11)+"".substring(0,3);
			elem.style.opacity = elem.fvalue = fvalue;
			if(fvalue>(0.9)){
				elem.style.opacity = elem.fvalue = 1;
				window.clearInterval(elem.eFade);elem.eFade = false;
				if(callback){callback(elem);}
			}
		},interval);
	}
	function eFadeout(elem,callback,interval){
		if(!interval){interval=50;}
		var fvalue = 1;
		if(elem.eFade){window.clearInterval(elem.eFade);elem.eFade = false;fvalue = elem.style.opacity ? elem.style.opacity : 1;}
		elem.style.opacity = elem.fvalue = fvalue;
		elem.eFade = window.setInterval(function(){
			fvalue = (parseFloat(elem.fvalue)-0.11)+"".substring(0,3);
			elem.style.opacity = elem.fvalue = fvalue;
			if(fvalue<(0.1)){
				elem.style.visibility = "hidden";
				elem.style.opacity = elem.fvalue = 0;
				window.clearInterval(elem.eFade);elem.eFade = false;
				if(callback){callback(elem);}
			}
		},interval);
	}
	/*Time:la posicion del tiempo, Begin:tamaño inicial del contenedor, LeftOffset:tamaño que tiene que incrementar el contenedor, Duration: Debe ser mayor que time */
	function easeInOutCubic(t,b,c,d){if((t /= d / 2) < 1){return c / 2 * t * t * t + b;}return c / 2 * ((t -= 2) * t * t + 2) + b;}
	function eEaseHeight(elem,heightChange,callback,time,interval,absoluteHeight){
		if(!time){time = 1000;}
		if(!interval){interval = 50;}
		if(elem.eEaseH){window.clearInterval(elem.eEaseH);elem.eEaseH = false;}
		if(!elem.innerHeight){$fix(elem);}
		var initHeight = elem.innerHeight();var t = 0;
		if(absoluteHeight){heightChange = (heightChange-initHeight);if(heightChange == 0){return;}}
		elem.eEaseH = window.setInterval(function(){
			var w = easeInOutCubic(t,initHeight,heightChange,time);
			t += interval;elem.style.height = w+"px";
			if(t >= time){elem.style.height = (initHeight+heightChange)+"px";window.clearInterval(elem.eEaseH);elem.eEaseH = false;if(callback){callback(elem);}}
		},time/interval);
	}
	function eEaseWidth(elem,widthChange,callback,time,interval,absoluteWidth){
		if(!time){time = 1000;}
		if(!interval){interval = 50;}
		if(elem.eEaseW){window.clearInterval(elem.eEaseW);elem.eEaseW = false;}
		if(!elem.innerWidth){$fix(elem);}
		var initWidth = elem.innerWidth();var t = 0;
		if(absoluteWidth){widthChange = (widthChange-initWidth);if(widthChange == 0){return;}}
		elem.eEaseW = window.setInterval(function(){
			var w = easeInOutCubic(t,initWidth,widthChange,time);
			t += interval;elem.style.width = w+"px";
			if(t >= time){elem.style.width = (initWidth+widthChange)+"px";window.clearInterval(elem.eEaseW);elem.eEaseW = false;if(callback){callback(elem);}}
		},time/interval);
	}
	function eEaseReset(elem){elem.$B({'.visibility':'visible','.overflow':'auto','.opacity':1,'.height':'auto'});}
	function eEasePrepare(elem){elem.$B({'.visibility':'hidden','.overflow':'hidden','.opacity':0,'.height':0});}
	function eEaseEnter(el,params){
		if(!params){params = {};}
		if(!params.time){params.time = 1000;}
		if(!params.interval){params.interval = 50;}
		var currentHeight = el.offsetHeight;
		eEaseReset(el);var targetHeight = el.offsetHeight;eEasePrepare(el);
		var heightChange = (targetHeight-currentHeight);var t = 0;
		eFadein(el);
		el.eEaseEnter = setInterval(function(){
			var w = easeInOutCubic(t,currentHeight,heightChange,params.time);
			t += params.interval;el.style.height = w+'px';
			if(t >= params.time){el.style.height = targetHeight+'px';clearInterval(el.eEaseEnter);el.eEaseEnter = false;if(params.callback){params.callback(el);}}
		},params.time/params.interval);
	}
	function eEaseLeave(el,params){
		if(!params){params = {};}
		if(!params.time){params.time = 1000;}
		if(!params.interval){params.interval = 50;}
		var currentHeight = el.offsetHeight;
		var heightChange = (currentHeight*-1);var t = 0;
		el.style.height = currentHeight+'px';el.style.overflow = 'hidden';
		eFadeout(el);
		el.eEaseLeave = setInterval(function(){
			var w = easeInOutCubic(t,currentHeight,heightChange,params.time);
			t += params.interval;el.style.height = w+'px';
			if(t >= params.time){el.style.height = 0;clearInterval(el.eEaseLeave);el.eEaseLeave = false;if(params.callback){params.callback(el);}}
		},params.time/params.interval);
	}
	function eTransition(c,n){
		/* c (current) & n (next) */
		var i = c.parentNode;i.$B({'.overflow':'hidden','.position':'relative'});n.$B({'.position':'absolute','.top':'0','.left':'0','.width':c.innerWidth()+'px'/*,'.visibility':'hidden'*/});i.appendChild(n);var oldHeight = c.innerHeight();var newHeight = n.innerHeight();var on = n.offsetHeight;
		eEaseHeight(i,on,function(el){el.$B({'.height':'100%'});},1250,false,true);
		eFadeout(c,function(el){el.parentNode.removeChild(el);});
		eFadein(n,function(el){el.$B({'.position':'static','.top':'auto','.left':'auto','.width':'auto'});});
	}
	function eAppendRowsToTbody(tbody,trs){
		var newHeight = 0;
		var table = $fix(tbody.parentNode,{'.position':'relative'});
		var t = $fix(table.parentNode,{'.height':table.innerHeight()+'px'});
		if(!t.className.match('transitionable')){return;}
		$A(trs).each(function(tr){tbody.appendChild(tr);});
		newHeight = tbody.innerHeight();
		eEaseHeight(t,newHeight,function(){eEaseReset(t);},false,false,true);
	}
	/*==FIN-EFFECTS==*/
