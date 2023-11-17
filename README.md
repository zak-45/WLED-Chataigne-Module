![image](https://user-images.githubusercontent.com/121941293/283798323-94bb9a2c-65b0-4d98-a483-e49d4d9b0eb1.png)

# **WLED Module for Chataigne.**

GitHub: https://github.com/benkuper/Chataigne

![image](https://user-images.githubusercontent.com/121941293/217917087-ea2df590-351b-4227-a9d8-8c8d560901e5.png)
![image](https://user-images.githubusercontent.com/121941293/217917410-3da07bff-7557-4584-a38e-68da940dde93.png)
![image](https://user-images.githubusercontent.com/121941293/217919097-581316d6-cd22-4679-8509-b634ba67878a.png)

### ***Installation :***

Manual
```
Take all from this repository and 
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

Go to Modules, right click, Software, WLED if not already installed.
```
![image](https://user-images.githubusercontent.com/121941293/217875056-b8336e70-1c07-4d93-97de-dde0563a8046.png)


```
On Inspector:
	Default IP: this will be the default WLED IP address used (cause could be more than one)
	LoopIP : check it if you want to update more than one WLED device.
	     IP set in group WLED -- Custom Variables and only for HTTP.
	UDPReTransmit : number of time to retransmit UDP packet.
	     UDP protocol fast but not reliable, choose how many time retransmit packet in case of (max 5).
	AddIP : click on it to create a new entry where you can put additional WLED IP address to manage.
	     This will create a new IP parameter into the WLED Custom variables group.
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

## Video
Wled main features show:

https://youtu.be/Q1RK74ZtQqg

![image](https://github.com/zak-45/WLED-Chataigne-Module/assets/121941293/89fa5472-8529-4f9e-9c58-c7a060471c31)

---


### ***Info ***

This module use WLED API (Http / Json) to update data. Not all commands have been implemented, but probably the most used ones. 
UDP Sync can be used if some speed is needed on the WLED update, this is available only for the WLED Main command.

```
If you want the look and feel of the first screenshots, just use the wled.noisette file and the wled_logo_akemi.png provided.

```
