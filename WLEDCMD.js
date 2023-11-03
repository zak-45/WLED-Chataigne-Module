/* 

a:zak45
d:25/10/2022
v:1.6.0

Chataigne Module for  WLED

you can modify mains params to one or more WLED devices (at same time)

Parameters can be sent via UDP when need some "real time".

----- Packet definition for WLEd Data
byte udpOut[WLEDPACKETSIZE];
  Segment& mainseg = strip.getMainSegment();
  udpOut[0] = 0; //0: wled notifier protocol 1: WARLS protocol
  udpOut[1] = callMode;
  udpOut[2] = bri;
  uint32_t col = mainseg.colors[0];
  udpOut[3] = R(col);
  udpOut[4] = G(col);
  udpOut[5] = B(col);
  udpOut[6] = nightlightActive;
  udpOut[7] = nightlightDelayMins;
  udpOut[8] = mainseg.mode;
  udpOut[9] = mainseg.speed;
  udpOut[10] = W(col);
  //compatibilityVersionByte: 
  //0: old 1: supports white 2: supports secondary color
  //3: supports FX intensity, 24 byte packet 4: supports transitionDelay 5: sup palette
  //6: supports timebase syncing, 29 byte packet 7: supports tertiary color 8: supports sys time sync, 36 byte packet
  //9: supports sync groups, 37 byte packet 10: supports CCT, 39 byte packet 11: per segment options, variable packet length (40+MAX_NUM_SEGMENTS*3)
  //12: enhanced effct sliders, 2D & mapping options
  udpOut[11] = 12;
  col = mainseg.colors[1];
  udpOut[12] = R(col);
  udpOut[13] = G(col);
  udpOut[14] = B(col);
  udpOut[15] = W(col);
  udpOut[16] = mainseg.intensity;
  udpOut[17] = (transitionDelay >> 0) & 0xFF;
  udpOut[18] = (transitionDelay >> 8) & 0xFF;
  udpOut[19] = mainseg.palette;
  col = mainseg.colors[2];
  udpOut[20] = R(col);
  udpOut[21] = G(col);
  udpOut[22] = B(col);
  udpOut[23] = W(col);
  
------------------------------------------------------------------------------------------

  
*/


// Main module parameters 
var params = {};
	params.dataType = "json";
	params.extraHeaders = "Content-Type: application/json";
var payload = {}; //the payload can be either a simple string or an object that will be automatically stringified
	params.payload = payload;

// UDP 
var UDP_SYNC = [];
var udpModule = root.modules.getItemWithName("WLEDSYNC");

// init
var isInit = true;
var SCAexist = root.modules.getItemWithName("SCAnalyzer");

// default url
var wled_url = "http://127.0.0.1/json";

//We create necessary entries in modules & custom variables.
function init ()
{
	script.log("-- Custom command called init()");	
	
	var infos = util.getOSInfos(); 
	
	script.log("Hello "+infos.username);	
	script.log("We run under : "+infos.name);
	
}

function update()
{
	if (isInit === true)	
	{ 

		if (SCAexist.name == "sCAnalyzer")
		{	
			script.log("SCAnalyzer present");
			//root.modules.sCAnalyzer.scripts.sCAnalyzer.reload.trigger();
			var wledcontainer = SCAexist.parameters.getChild("WLED Params");
			wledcontainer.setCollapsed(false);
			
		} else {
				
			script.log('No SCAnalyzer found');			
		}

		if (checkModuleExist("WLEDSync"))
		{
			
			script.log("WLED UDP SYNC exist");
			
			} else {
				
				udpModule = root.modules.addItem("UDP");
				udpModule.parameters.autoAdd.set(false);
				udpModule.parameters.input.enabled.set(false);
				udpModule.parameters.output.local.set(false);			
				udpModule.parameters.output.remotePort.set(21324);
				udpModule.setName("WLEDSYNC");	
		}

		var DFexist = root.customVariables.getItemWithName("WLED");	
		
		if (DFexist.name == "wled")
		{
			
			script.log("Default variables group WLED exist");
			
			} else {
				
				var newDFCustomVariables = root.customVariables.addItem("WLED"); 
				newDFCustomVariables.setName("WLED");	
		}

		isInit = false;
		script.log("isinit");
	}
}

function moduleParameterChanged (param)
{	
	script.log("Param changed : "+param.name);

	// Add WLED IP address to manage 
	if (param.name == "addIP")
	{
		var groupExist = root.customVariables.getItemWithName("WLED");
		
		if (groupExist.name == "wled")
		{
			
			var newIP = root.customVariables.wled.variables.addItem("String Parameter");
			newIP.setName("IP");
			var newIPV = newIP.getChild(newIP.name);
			newIPV.set("0.0.0.0");
			
			util.showMessageBox("Add IP", "Additional IP has been set into WLED Custom Variables group, go there and set the IP address", "Info", "Got it");
		
		} else {
			
			util.showMessageBox("Add IP ERROR", "WLED Custom Variables group do not exist", "warning", "Got it");
		}
		
	} else if (param.name == "wledInfo") {
		
		util.gotoURL('https://kno.wled.ge/');
		
	} else if (param.name == "defaultIP"){
		
		defaultIP = param.get();
		if (defaultIP == "")
		{
			defaultIP = "127.0.0.1";
		}
		
		udpModule.parameters.output.remoteHost.set(defaultIP);		
		
		wled_url = "http://"+defaultIP+"/json";
		local.parameters.autoAdd.set(0);
		local.parameters.baseAddress.set(wled_url);
		
		if (isInit === false)
		{
			WLEDdashboard(defaultIP);
		}
		
	} else if (param.name == "useWS" && isInit === false) {
		
		//script.log("Websocket");
		if (local.parameters.wledParams.useWS.get() == 1 && local.parameters.defaultIP.get() != "") {
			createWS(local.parameters.defaultIP.get());
			local.parameters.wledParams.loopIP.set(0);
		}
	}
}

/*

WLED Specifics

*/

// set required WLED settings
function WLEDMain(wledIP)
{
	payload = {}; //the payload can be either a simple string or an object that will be automatically stringified
	params.payload = payload;
	
	// We take default value from WLED Params if we change nothing
	if (wledIP == "0.0.0.0" || wledIP == "")
	{	
		wledIP = local.parameters.defaultIP.get();
		
		if (wledIP == "")
		{
			wledIP = "127.0.0.1";
		}
	}	

	wled_url = "http://"+wledIP+"/json";

	local.parameters.autoAdd.set(0);
	local.parameters.baseAddress.set(wled_url);
	
	script.log("WLED URL : " + wled_url);
		

return wledIP;
}

// We check if need to execute the same on additional WLED devices --> root.customVariables.wled.variables (with name IP1 / IP2 etc...)
function WLEDLoopCMD()
{
	var testloop = local.parameters.wledParams.loopIP.get();

	if ( testloop == 1 )
	{
		// retreive variables
		var additionalIP = root.customVariables.wled.variables.getItems();
		
		if (additionalIP)
		{
			script.log("WLED -- Number of additional IP address : "+additionalIP.length);
			
			for ( var i = 0; i < additionalIP.length; i++) 
			{ 
		
				if (additionalIP[i].name.contains("ip"))
				{				
					var ipname = additionalIP[i].name;
					
					var newIP = additionalIP[i].getChild(ipname);				
					var addIP = newIP.get();
					
					if (addIP != "0.0.0.0" && addIP != "")
					{
						script.log("Run cmd to : " +ipname + " with IP : "+addIP);
						
						if (udp)
						{
							udpModule.sendBytesTo(addIP,uDPPort,udpdata);
							for ( var j = 0; j < root.modules.wled.parameters.wledParams.uDPReTransmit.get(); j++)
							{
								udpModule.sendBytesTo(addIP,uDPPort,udpdata);
							}
							
						} else {
							
							wled_url = "http://"+addIP+"/json";
							local.parameters.baseAddress.set(wled_url);
							local.sendPOST("/state",params);							
						}
										
					} else {
					
						script.log("We bypass this one (value) : "+additionalIP[i].name);
					}
					
				} else {
					
					script.log("We bypass this one (name) : "+additionalIP[i].name);
					
				}
			}
		}
	}
}

// Set all parameters to WLED device
function WLEDCommands (wledIP,live,on,udp,uDPPort,wledcolor,bgcolor,brightness,wledeffect,fxspeed,fxintensity,palette,wledgroup,wledws,wledps,wledtt)
{

	// brightness
	var bri = parseInt(brightness);
	
	// main color settings
	var valueR = parseInt(wledcolor[0]*255);
	var valueG = parseInt(wledcolor[1]*255);
	var valueB = parseInt(wledcolor[2]*255);
	// bg color settings
	var bgvalueR = parseInt(bgcolor[0]*255);
	var bgvalueG = parseInt(bgcolor[1]*255);
	var bgvalueB = parseInt(bgcolor[2]*255);
	
	// effect settings
	var sx = parseInt(fxspeed);
	var ix = parseInt(fxintensity);
	

	// UDP data only
	// During mapping generated by SCAnalyzer, only UDP (or WS) should be used
	if ((wledgroup != "" && wledws == 0) || udp == 1) 
	{
		var udpdata = udpsync();
		var myIP = WLEDMain(wledIP);
		
		script.log("UDP sent only to this IP : " + myIP);
		
		if (uDPPort == 0)
		{
			uDPPort = udpModule.parameters.output.remotePort.get();
		}
		
		udpModule.sendBytesTo(myIP,uDPPort,udpdata);
		
		for ( var j = 0; j < root.modules.wled.parameters.wledParams.uDPReTransmit.get(); j++)
			{
				udpModule.sendBytesTo(myIP,uDPPort,udpdata);
			}
	
	// Http or UDP or WS
	} else {
		
		var myIP = WLEDMain(wledIP);
		
		script.log(" To IP: " + myIP + " and UDP port : " + uDPPort);
		
		if (udp)
		{	
			var udpdata = udpsync();
			if (uDPPort == 0)
			{
				uDPPort = udpModule.parameters.output.remotePort.get();
			} 
			
			udpModule.sendBytesTo(myIP,uDPPort,udpdata);
			
			for ( var j = 0; j < root.modules.wled.parameters.wledParams.uDPReTransmit.get(); j++)
				{
					udpModule.sendBytesTo(myIP,uDPPort,udpdata);
				}		
			
		} else {

			// Seg dict
			var varseg = {'col':[[valueR,valueG,valueB]],'fx':wledeffect,'sx':sx,'ix':ix,'pal':palette};

			payload.live = live;
			payload.on = on;
			payload.bri = bri;
			payload.seg = varseg;
			
			if (wledps != 0)
			{
				payload.ps = wledps;
			}
			if (wledtt != -1)
			{
				payload.tt = wledtt;
			}		
			// WS
			if (wledws == 1)
			{
				//script.log("Websocket");
				var ipname = myIP + "-" + "ws";
				var WSexist = root.modules.getItemWithName(ipname);

				if (WSexist.name != "undefined")
				{
					var mydata = JSON.stringify(params.payload);
					WSexist.send(mydata);
					
				} else {
					
					script.log("Module WS do not exist");
					// Create WS 
					createWS(myIP);
				}

			// HTTP
			} else {
		
				// we post for the default IP
				local.sendPOST("/state",params);
				// we check if more IP need to be updated
				WLEDLoopCMD();
				
			}
		}		
	}
}

//get info from WLED device / Values can be seen under WLED module
function WLEDInfo (wledIP)
{	
	WLEDMain(wledIP);	
	local.parameters.autoAdd.set(1);

	local.sendGET("","json");	
}

//set palette to WLED device
function WLEDPalette (wledIP,palette)
{
	var myIP = WLEDMain(wledIP);	
	var varseg = {'pal':palette};
	payload.seg = varseg;

	// WS or HTTP
	if 	( local.parameters.wledParams.useWS.get() == 1 || 
		( SCAexist.name == "sCAnalyzer" && root.modules.sCAnalyzer.parameters.wledParams.useWebSocket.get() == 1) )
	{
		//script.log("Websocket");
		var ipname = myIP + "-" + "ws";
		var WSexist = root.modules.getItemWithName(ipname);

		if (WSexist.name != "undefined")
		{
			var mydata = JSON.stringify(params.payload);
			WSexist.send(mydata);
			
		} else {
			
			script.log("Module WS do not exist");
			// Create WS 
			createWS(myIP);
		}
		
	} else {
	
		// we post for the default IP
		local.sendPOST("/state",params);

		// we check if more IP need to be updated
		WLEDLoopCMD();
	}	
}

//set playlist to WLED device
function WLEDPlaylist (wledIP,playlist)
{
	var myIP = WLEDMain(wledIP);	
	payload.ps = playlist;

	// WS or HTTP
	if 	( local.parameters.wledParams.useWS.get() == 1 || 
		( SCAexist.name == "sCAnalyzer" && root.modules.sCAnalyzer.parameters.wledParams.useWebSocket.get() == 1) )
	{
		//script.log("Websocket");
		var ipname = myIP + "-" + "ws";
		var WSexist = root.modules.getItemWithName(ipname);

		if (WSexist.name != "undefined")
		{
			var mydata = JSON.stringify(params.payload);
			WSexist.send(mydata);
			
		} else {
			
			script.log("Module WS do not exist");
			// Create WS 
			createWS(myIP);
		}
		
	} else {
	
		// we post for the default IP
		local.sendPOST("/state",params);

		// we check if more IP need to be updated
		WLEDLoopCMD();
	}	
}

//set effect to WLED device
function WLEDEffect (wledIP,wledeffect,fxspeed,fxintensity)
{
	
	var myIP = WLEDMain(wledIP);
	var sx = parseInt(fxspeed);
	var ix = parseInt(fxintensity);
	var varseg = {'fx':wledeffect,'sx':sx,'ix':ix};	
	payload.seg = varseg;
	// WS or HTTP
	if 	( local.parameters.wledParams.useWS.get() == 1 || 
		( SCAexist.name == "sCAnalyzer" && root.modules.sCAnalyzer.parameters.wledParams.useWebSocket.get() == 1) )
	{
		//script.log("Websocket");
		var ipname = myIP + "-" + "ws";
		var WSexist = root.modules.getItemWithName(ipname);

		if (WSexist.name != "undefined")
		{
			var mydata = JSON.stringify(params.payload);
			WSexist.send(mydata);
			
		} else {
			
			script.log("Module WS do not exist");
			// Create WS 
			createWS(myIP);
		}
		
	} else {
	
		// we post for the default IP
		local.sendPOST("/state",params);

		// we check if more IP need to be updated
		WLEDLoopCMD();
	}	
}

//set Next -  Previous effect to WLED device
function WLEDEffectNP (wledIP,wledeffect)
{
	var myIP = WLEDMain(wledIP);
	var varseg = {'fx':wledeffect};	
	payload.seg = varseg;
	
	// WS or HTTP
	if 	( local.parameters.wledParams.useWS.get() == 1 || 
		( SCAexist.name == "sCAnalyzer" && root.modules.sCAnalyzer.parameters.wledParams.useWebSocket.get() == 1) )
	{
		//script.log("Websocket");
		var ipname = myIP + "-" + "ws";
		var WSexist = root.modules.getItemWithName(ipname);

		if (WSexist.name != "undefined")
		{
			var mydata = JSON.stringify(params.payload);
			WSexist.send(mydata);
			
		} else {
			
			script.log("Module WS do not exist");
			// Create WS 
			createWS(myIP);
		}
		
	} else {
	
		// we post for the default IP
		local.sendPOST("/state",params);

		// we check if more IP need to be updated
		WLEDLoopCMD();
	}	
}

//set brightness to WLED device. Use WS if checked and SCAnalyzer present
function WLEDBrightness(wledIP,brightness)
{
	var myIP = WLEDMain(wledIP);	
	payload.bri = parseInt(brightness);	
	
	// WS or HTTP
	if 	( local.parameters.wledParams.useWS.get() == 1 || 
		( SCAexist.name == "sCAnalyzer" && root.modules.sCAnalyzer.parameters.wledParams.useWebSocket.get() == 1) )
	{
		//script.log("Websocket");
		var ipname = myIP + "-" + "ws";
		var WSexist = root.modules.getItemWithName(ipname);

		if (WSexist.name != "undefined")
		{
			var mydata = JSON.stringify(params.payload);
			WSexist.send(mydata);
			
		} else {
			
			script.log("Module WS do not exist");
			// Create WS 
			createWS(myIP);
		}
		
	} else {
	
		// we post for the default IP
		local.sendPOST("/state",params);

		// we check if more IP need to be updated
		WLEDLoopCMD();
	}
}

//set color to WLED device. Use WS if checked and SCAnalyzer present
function WLEDColor(wledIP,wledcolor)
{
	var myIP = WLEDMain(wledIP);
	var valueR = parseInt(wledcolor[0]*255);
	var valueG = parseInt(wledcolor[1]*255);
	var valueB = parseInt(wledcolor[2]*255);
	var sx = parseInt(fxspeed);
	var varseg = {'col':[[valueR,valueG,valueB]]};	
	payload.seg = varseg;

	// WS
	if 	( local.parameters.wledParams.useWS.get() == 1 || 
		( SCAexist.name == "sCAnalyzer" && root.modules.sCAnalyzer.parameters.wledParams.useWebSocket.get() == 1) )
	{
		//script.log("Websocket");
		var ipname = myIP + "-" + "ws";
		var WSexist = root.modules.getItemWithName(ipname);

		if (WSexist.name != "undefined")
		{
			var mydata = JSON.stringify(params.payload);
			WSexist.send(mydata);
			
		} else {
			
			script.log("Module WS do not exist");
			// Create WS 
			createWS(myIP);
		}
		
	} else {
	
		// we post for the default IP
		local.sendPOST("/state",params);

		// we check if more IP need to be updated
		WLEDLoopCMD();
	}
}

//set live & On  to WLED device (only HTTP)
function WLEDOnOff(wledIP,live,on)
{
	WLEDMain(wledIP);
	
	payload.live = live;
	payload.on = on;	

	// we post for the default IP
	local.sendPOST("/state",params);

	// we check if more IP need to be updated
	WLEDLoopCMD();
}

//Reboot WLED device (only HTTP)
function WLEDReboot(wledIP,reboot)
{
	
	WLEDMain(wledIP);
	
	payload.rb = reboot;

	// we post for the default IP
	local.sendPOST("/state",params);

	// we check if more IP need to be updated
	WLEDLoopCMD();
}

// UDP data to send
function udpsync()
{

// WLED UDP Sync  mode 5
	var UDP_SYNC = [];
	UDP_SYNC[0] =  0;
	UDP_SYNC[1] =  1;
	UDP_SYNC[2] = brightness;
	UDP_SYNC[3] = valueR;
	UDP_SYNC[4] = valueG;
	UDP_SYNC[5] = valueB;
	UDP_SYNC[6] = 0;
	UDP_SYNC[7] = 0;
	UDP_SYNC[8] = wledeffect;
	UDP_SYNC[9] = sx;
	UDP_SYNC[10] = valueW;
	UDP_SYNC[11] = 5;
	UDP_SYNC[12] = bgvalueR;
	UDP_SYNC[13] = bgvalueG;
	UDP_SYNC[14] = bgvalueB;
	UDP_SYNC[15] = bgvalueW;
	UDP_SYNC[16] = ix;
	UDP_SYNC[17] = st;
	UDP_SYNC[18] = su;
	UDP_SYNC[19] = palette;
	UDP_SYNC[20] = bgvalueR;
	UDP_SYNC[21] = bgvalueG;
	UDP_SYNC[22] = bgvalueB;
	UDP_SYNC[23] = bgvalueW;

return UDP_SYNC;
}

// create / update WLED dashboard
function WLEDdashboard(defaultIP)
{
	var dashExist = root.dashboards.getItemWithName("wledWebPage");
	
	if (dashExist.name == "wledWebPage"){

		dashExist.dashboard.iFrame.url.set('http://' + defaultIP);
		script.log('Dashboard present');
		
	} else {

		script.log("Creating WLED dashboard");
		var newdash = root.dashboards.addItem();
		newdash.dashboard.canvasSize.set(600,400);
		var newiframe = newdash.dashboard.addItem("IFrame"); 
		newiframe.url.set("http://"+defaultIP);
		newiframe.viewUIPosition.set(-300,-200);
		newiframe.viewUISize.set(600,400);

		newdash.setName("WLED Web Page");

		root.dashboards.editMode.set(false);
	}
}

// create WS module for an IP address
function createWS(wsip)
{
	var ipname = wsip + "-" + "ws";
	var WSexist = root.modules.getItemWithName(ipname);

	if (WSexist.name != "undefined")
	{	
		script.log("Module WS exist");
		
	} else {
		
		var newWSModule = root.modules.addItem("WebSocket Client");
		newWSModule.parameters.protocol.set("JSON");
		newWSModule.parameters.autoAdd.set(false);
		newWSModule.parameters.serverPath.set(wsip+"/ws");
		newWSModule.setName(wsip+"-"+"ws");
		
	}	
}

function checkModuleExist (moduleName)
{
	var moduleExist = root.modules.getItemWithName(moduleName);
	var result = false;
	if (moduleExist.name != "undefined")
	{
		result = true;
	}
	return result;
}

