/* 

a:zak45
d:25/10/2022
v:1.0.0

Chataigne Module for  WLED

you can modify mains params to one or more WLED devices (at same time)

Parameters can be sent via UDP when need some "real time".

----- Packet definition 
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
*/


// Main module parameters 
var params = {};
	params.dataType = "json";
	params.extraHeaders = "Content-Type: application/json";
var payload = {}; //the payload can be either a simple string or an object that will be automatically stringified
	params.payload = payload;

// UDP 
var UDP_SYNC = [];


//We create necessary entries in modules & custom variables.
function init ()
{
	script.log("-- Custom command called init()");	
	
	var DFexist = root.customVariables.getItemWithName("WLED");
	var SCAexist = root.modules.getItemWithName("SCAnalyzer");
	var UDPexist = root.modules.getItemWithName("WLEDSYNC");
	
	if (DFexist.name == "wled")
	{
		
		script.log("Default variables group WLED exist");
		
		} else {
			
			var newDFCustomVariables = root.customVariables.addItem("WLED"); 
			newDFCustomVariables.setName("WLED");	
	}

	if (SCAexist.name == "sCAnalyzer")
	{	
		script.log("SCAnalyzer present");
		var wledcontainer = SCAexist.parameters.getChild("WLED Params");
		wledcontainer.setCollapsed(false);
		
	} else {
			
		script.log('No SCAnalyzer found');			
	}

	if (UDPexist.name == "wledsync")
	{
		
		script.log("WLED UDP SYNC exist");
		
		} else {
			
			var newUDP = root.modules.addItem("UDP");
			newUDP.parameters.autoAdd.set(false);
			newUDP.parameters.input.enabled.set(false);
			newUDP.parameters.output.local.set(false);			
			newUDP.parameters.output.remotePort.set(21324);
			newUDP.setName("WLEDSYNC");	
	}

	var infos = util.getOSInfos(); 
	
	script.log("Hello "+infos.username);	
	script.log("We run under : "+infos.name);
	
	// dashboard
	WLEDdashboard();
}

// execution depend on the user response
function messageBoxCallback (id, result)
{
	script.log("Message box callback : "+id+" : "+result); 
	
	if (id=="confirmLedFX")
	{
		if (result==1){
					var launchresult = root.modules.os.launchProcess(LedFXPath+LedFXExeName, false);					
					script.log("LedFX return code : "+launchresult);					
		}
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
			var newIPV = newIP.getChild(newIP.name);
			newIPV.set("0.0.0.0");
			newIP.setName("IP");
			util.showMessageBox("Add IP", "Additional IP has been set into WLED Custom Variables group, go there and set the IP address", "Info", "Got it");
		
		} else {
			
			util.showMessageBox("Add IP ERROR", "WLED Custom Variables group do not exist", "warning", "Got it");
		}
	}

	if (param.name == "wledInfo")
	{
		util.gotoURL('https://kno.wled.ge/');		
	}
	
	if (param.name == "defaultIP")
	{
		root.modules.wledsync.parameters.output.remoteHost.set(root.modules.wled.parameters.defaultIP.get());
		WLEDdashboard();
	}

}

/*

WLED Specifics

*/

// set required WLED settings
function WLEDMain(wledIP)
{
	var HTTPModule = root.modules.getItemWithName("WLED");

	if (HTTPModule.name == "wled")
	{
		payload = {}; //the payload can be either a simple string or an object that will be automatically stringified
		params.payload = payload;
		
		// We take default value from WLED Params if we change nothing
		if (wledIP == "0.0.0.0" || wledIP == "")
		{
			
			wledIP = HTTPModule.parameters.defaultIP.get();		

		}	

		var wled_url = "http://"+wledIP+"/json";

		HTTPModule.parameters.autoAdd.set(0);
		HTTPModule.parameters.baseAddress.set(wled_url);
		
	} else {
		
		script.logError('WLED module not found');
		util.showMessageBox("WLED ERROR", "WLED module do not exist", "warning", "Got it");
	}

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
			var portNumber = root.modules.wledsync.parameters.output.remotePort.get();
			
			for (i = 0; i < additionalIP.length; i++) 
			{ 
		
				if (additionalIP[i].name.contains("ip"))
				{				
					ipname = additionalIP[i].name;
					
					var newIP = additionalIP[i].getChild(ipname);				
					var addIP = newIP.get();
					
					if (addIP != "0.0.0.0" && addIP != "")
					{
						if (udp)
						{
							root.modules.wledsync.sendBytesTo(addIP,uDPPort,udpdata);
							for (j = 0; j < root.modules.wled.parameters.wledParams.uDPReTransmit.get(); j++)
							{
								root.modules.wledsync.sendBytesTo(addIP,uDPPort,udpdata);
							}
							
						} else {
							
							var wled_url = "http://"+addIP+"/json";
							var HTTPModule = root.modules.getItemWithName("WLED");
							
							script.log("Run cmd to : " +ipname + " with IP : "+addIP);
							
							HTTPModule.parameters.baseAddress.set(wled_url);
							HTTPModule.sendPOST("/state",params);
						}
						
					} else {
					
						script.log("We bypass this one: "+additionalIP[i].name);
					}
					
				} else {
					
					script.log("We bypass this one: "+additionalIP[i].name);
					
				}
			}
		}
	}
}

// Set all parameters to WLED device
function WLEDCommands (wledIP,live,on,udp,uDPPort,wledcolor,bgcolor,brightness,wledeffect,fxspeed,fxintensity,palette)
{
	var myIP = WLEDMain(wledIP);

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
	
	// Seg dict
	var varseg = {'col':[[valueR,valueG,valueB]],'fx':wledeffect,'sx':sx,'ix':ix,'pal':palette};
	
	script.log("-- Custom command main color Red/Green/Blue :"+valueR+" -- "+valueG+" -- "+valueB);	
	script.log("-- Custom command bg color Red/Green/Blue :"+bgvalueR+" -- "+bgvalueG+" -- "+bgvalueB);		
	script.log("-- Custom command effect :"+wledeffect);	
	script.log(" To IP: " + myIP + " and UDP port : " + uDPPort);
	
	if (udp)
	{	
		var udpdata = udpsync();
		if (uDPPort == 0)
		{
			uDPPort = root.modules.wledsync.parameters.output.remotePort.get();
		}
		
		root.modules.wledsync.sendBytesTo(myIP,uDPPort,udpdata);
		for (j = 0; j < root.modules.wled.parameters.wledParams.uDPReTransmit.get(); j++)
			{
				root.modules.wledsync.sendBytesTo(myIP,uDPPort,udpdata);
			}		
		
	} else {

		payload.live = live;
		payload.on = on;
		payload.bri = bri;
		payload.seg = varseg;
	
		// we post for the default IP
		local.sendPOST("/state",params);
	}
	
	// we check if more IP need to be updated
	WLEDLoopCMD();
}

//get info from WLED device / Values can be seen under WLED module
function WLEDInfo (wledIP)
{
	
	WLEDMain(wledIP);
	
	var HTTPModule = root.modules.getItemWithName("WLED");

	HTTPModule.parameters.autoAdd.set(1);

	HTTPModule.sendGET("","json");	
	
}

//set palette to WLED device
function WLEDPalette (wledIP,palette)
{
	
	WLEDMain(wledIP);
	
	var varseg = {'pal':palette};
	payload.seg = varseg;
	
	// we post for the default IP
	local.sendPOST("/state",params);
	
	// we check if more IP need to be updated
	WLEDLoopCMD();
	
}

//set effect to WLED device
function WLEDEffect (wledIP,wledeffect,fxspeed,fxintensity)
{
	
	WLEDMain(wledIP);

	var sx = parseInt(fxspeed);
	var ix = parseInt(fxintensity);
	var varseg = {'fx':wledeffect,'sx':sx,'ix':ix};	
	payload.seg = varseg;
	
	// we post for the default IP
	local.sendPOST("/state",params);

	// we check if more IP need to be updated
	WLEDLoopCMD();	
}

//set Next -  Previous effect to WLED device
function WLEDEffectNP (wledIP,wledeffect)
{
	
	WLEDMain(wledIP);

	var varseg = {'fx':wledeffect};	
	payload.seg = varseg;
	
	// we post for the default IP
	local.sendPOST("/state",params);

	// we check if more IP need to be updated
	WLEDLoopCMD();	
}

//set brightness to WLED device
function WLEDBrightness(wledIP,brightness)
{
	
	WLEDMain(wledIP);
	
	payload.bri = parseInt(brightness);	
	
	// we post for the default IP
	local.sendPOST("/state",params);

	// we check if more IP need to be updated
	WLEDLoopCMD();
}

//set color to WLED device
function WLEDColor(wledIP,wledcolor)
{
	
	WLEDMain(wledIP);

	var valueR = parseInt(wledcolor[0]*255);
	var valueG = parseInt(wledcolor[1]*255);
	var valueB = parseInt(wledcolor[2]*255);
	var sx = parseInt(fxspeed);
	var varseg = {'col':[[valueR,valueG,valueB]]};	
	payload.seg = varseg;
	
	// we post for the default IP
	local.sendPOST("/state",params);

	// we check if more IP need to be updated
	WLEDLoopCMD();
}

//set live & On  to WLED device
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

//Reboot WLED device
function WLEDReboot(wledIP,reboot)
{
	
	WLEDMain(wledIP);
	
	payload.rb = reboot;

	// we post for the default IP
	local.sendPOST("/state",params);

	// we check if more IP need to be updated
	WLEDLoopCMD();
}

function udpsync(UDP_SYNC)
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
function WLEDdashboard()
{
	
	var dashExist = root.dashboards.getItemWithName("wledWebPage");
	
	if (dashExist.name == "wledWebPage"){

		dashExist.dashboard.iFrame.url.set('http://' + root.modules.wled.parameters.defaultIP.get());
		script.log('Dashboard present');
		
	} else {

		script.log("Creating WLED dashboard");
		var newdash = root.dashboards.addItem();
		var newiframe = newdash.dashboard.addItem("IFrame"); 
		newiframe.url.set('http://127.0.0.1');
		newiframe.viewUISize.set(600,500);

		newdash.setName("WLED Web Page");

		root.dashboards.editMode.set(false);
	}
}