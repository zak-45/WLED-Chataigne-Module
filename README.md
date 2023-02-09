# **WLED Module for Chataigne.**

### ***Installation :***

Manual
```
Copy  to <MyDocuments>\chataigne\modules\WLED.
```
From Chataigne 
```
Right click on Modules, Get more modules .... and select WLED from Inspector.
```
![image](https://user-images.githubusercontent.com/121941293/217872642-e380f4ef-6b3b-430d-8ec1-e5aedd09e587.png)


### ***Use it :***

```
Open  Chataigne.

Go to Modules, right click, Software, WLED

On Inspector:
	Default IP: this will be the default WLED IP address used (cause could be more than one)
	LoopIP : check it if you want to update more than one WLED device.
	UDPReTransmit : number of time to retransmit UDP packet.
	AddIP : click on it to create a new entry where you can put additional WLED IP address to manage.
	
On Command Tester, WLED: all WLED available commands
	
On Custom Variables, group WLED:
	IP(x): change 0.0.0.0 by the IP address of the additional WLED device
```
### ***Info ***

This module use WLED API (Http / Json) to update data. Not all commands have been implemented, but probably the most used ones. 
UDP Sync can be used if some speed is needed on the WLED update, this is available only for the WLED Main command.
