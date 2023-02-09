# **WLED Module for Chataigne.**

### ***Installation :***

Manual
```
Copy  to <MyDocuments>\chataigne\modules\WLED.
```
From Chataigne 
```
Right click on Modules, Get more modules or File/Community modules manager.... and select WLED from Inspector.
```
![image](https://user-images.githubusercontent.com/121941293/217872642-e380f4ef-6b3b-430d-8ec1-e5aedd09e587.png)


### ***Use it :***

```
Open  Chataigne.

Go to Modules, right click, Software, WLED
```
![image](https://user-images.githubusercontent.com/121941293/217875056-b8336e70-1c07-4d93-97de-dde0563a8046.png)


```
On Inspector:
	Default IP: this will be the default WLED IP address used (cause could be more than one)
	LoopIP : check it if you want to update more than one WLED device.
	UDPReTransmit : number of time to retransmit UDP packet.
	AddIP : click on it to create a new entry where you can put additional WLED IP address to manage.
```
![image](https://user-images.githubusercontent.com/121941293/217876721-c0be515b-d0a1-4bec-a425-339e973e9822.png)

```
On Command Tester, WLED: all WLED available commands
```
![image](https://user-images.githubusercontent.com/121941293/217877203-7e832d2c-993a-41f4-9977-47a753c166ce.png)

```
On Custom Variables, group WLED:
	IP(x): change 0.0.0.0 by the IP address of the additional WLED device
```
![image](https://user-images.githubusercontent.com/121941293/217877867-e991865b-5033-409a-b99b-73b650732ef6.png)



### ***Info ***

This module use WLED API (Http / Json) to update data. Not all commands have been implemented, but probably the most used ones. 
UDP Sync can be used if some speed is needed on the WLED update, this is available only for the WLED Main command.
