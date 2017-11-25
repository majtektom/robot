# robot
raspberry pi, node, robotic, atmega

Wymagania
=========

hardware
========
* Raspberry pi3
 
* Kamera nie koniecznie dedykowana na rapberrypi (ja mam jakąć starą kamerę wifi gdzie moduł wifi się spalił ale sama kamera przerzyła ja się okazało była na usb więc dorobiłem kabelek i działa od razu w raspberry). Do tego ma doświetlanie w podczerwieni więc w nocy też widać.

* Sterownik serw Pololu Mini Maestro USB 18-kanałowy. Może być mniejszy zależy do czego potrzebujemy. Załatwia za nas dużo roboty z tworzeniem i sterowaniem przebiegami pwm. Komunikuje się po uarcie.

* Ramię robota. Moje ma 5 serw.

* Platforma jezdna. U mnie jest to MOBOT-MBv2-AVR wraz z elektroniką (uwaga jest inny procesor - orginalny był potrzebny gdzie indziej :) niż w orginale. Mam Atmega64, orginalnie był Atmega128 one są zamienne więc to nie problem). Płytka zawiera dwa mostki typu H MC33887 firmy Freescale  do sterowania silnikami DC.
platforma może być dowolna i własna elektronika, ale wtedy trzeba sobie zmodyfikować soft na atmegę.

* Przetwornice do zasilania całości. Ja mam 3 przetwornice regulowanie o wydajności 3A każda. Dwie są ustawione na 6v i zasilają serwa i jedna na 5V zasila raspberry pi3.

* Akumulator. Mam pakiet li-po 12V 2200mah 
 
software
=======
Program na atmega64 do platformy jezdnej.
------------------------------------------
Aktualnie steruje tylko silnikami, mnierzy napięcie i prady silników i serw. Komunikuje się z raspberry po i2c.


Raspberry pi3 napędza RASPBIAN JESSIE LITE wersja minimalna bez serwera X
-------------------------------------------------------------------------
konfiguracja raspbiana (coś mogłem pominąć piszę z pamięci):
-----------------------------------------------------------
sudo raspi-config
   ustawiamy polski, polskie kodowanie, włączmy ssh, uart, i2c, spi, poszerzamy partycję

ustawiamy połączenie wifi. Ja ma w ruterze ustawione stałe pi dla raspberry pi
```
sudo nano /etc/wpa_supplicant/wpa_supplicant.conf
```
i otwartym pliku ustawiamy zamieniająć na swoją sieć:
```
	network={
        ssid="NazwaSieciWiFi"
        psk="HasłoWiFi"
	}
```
resetujemy system. Od tej chwili można łączyć się przez ssh np. putty
``` 
 sudo reboot
```
   
   
aktualizujemy system
```
  sudo apt-get update
  sudo apt-get upgrade
  sudo apt-get install rpi-update
  sudo rpi-update
```

instalujemy
```
  sudo apt-get install i2c-tools watchdog mc git
  sudo apt-get install libv4l-dev libjpeg8-dev imagemagick build-essential cmake subversion
```
  
uprawnienia do kożystania z i2c i uart
```
  sudo chmod a+rw /dev/ttyAMA0
  sudo chmod a+rw /dev/i2c-1
  sudo adduser pi i2c
```

tworzymy ramdyski dla tymczasowych danych. Oszczędzamy kartę sd edytując plik 
```
sudo nano /etc/fstab
```
dopisujemy:
```
  tmpfs /tmp tmpfs defaults,noatime,nosuid,size=16M 0 0
  tmpfs /var/tmp tmpfs defaults,noatime,nosuid,size=16M 0 0
  # tmpfs /var/run tmpfs defaults,noatime,nosuid,mode=0777=2M 0 0
  tmpfs /var/log tmpfs defaults,noatime,nosuid,mode=0777,size=16M 0 0
```


uruchomienie kamery
------------------
strumień video leci przez mjpg-streamer bo mało obciąża system. pobieramy soft
```
git clone https://github.com/jacksonliam/mjpg-streamer.git
```
albo
```
wget http://lilnetwork.com/download/raspberrypi/mjpg-streamer.tar.gz
```
kompilujemy nasz pakiet wystarczy samo: 
```
make
```
test:
```
      ./mjpg-streamer -o "./output_http.so -c pi:123 -p 8090 -w ./www" \
      -o "./output_file.so -f /tmp -d 500 -s 8" \
      -i "./input_uvc.so -fps 10 -r 300x300 -y"
```
jak nie ma błędów to pod adresem localhost:8090 powinniśmy mieć obraz z kamery, po podaniu loginu  "pi" i hasła "123", a w katalogu /tmp powinno tworzyć się 8 obrazków jpg.
Jak działa to ctrl+c (ubijamy proces)
tworzymy deamona aby uruchamiało się przy starcie
kopiujemy jako root plik kamera.sh do /etc/init.d/ (uwaga dostosuj ścieżki w pliku do swoich wymagań) 
 ``` 
 sudo mv kamera.sh /etc/init.d
 ```
zmieniamy uprawnienia:
```
  sudo chmod 755 kamera.sh
```
tworzymy deamona:
```
    sudo update-rc.d kamera.sh defaults
```
startujemy deamona:
```
  sudo /etc/init.d/kamera.sh start
```
albo
```
  sudo systemctl enable kamera   <- chyba potrzebne za pierwszym razem
  sudo systemctl start kamera
 ```
czy działa
```
  sudo systemctl status kamera
```

instalacja node.js
-----------------
```
  sudo mkdir /opt/node	
  wget http://nodejs.org/dist/latest-v7.x/node-v7.1.0-linux-armv7l.tar.gz
  tar xvzf node-v0.11.2-linux-arm-pi.tar.gz
  sudo cp -r node-v0.11.2-linux-arm-pi/* /opt/node	
  rm -r node-v0.11.2-linux-arm-pi
  sudo nano /etc/profile 
```
  edytujemy przed export PATH:
    ```
	NODE_JS_HOME="/opt/node"
    PATH="$PATH:$NODE_JS_HOME/bin"
	```
```
  sudo reboot
```
tworzymy deamona do uruchumienia serwera na node. Tak samo jak kamery tylko kopiujemy skrypt nodejs.sh (uwaga dostosuj ścieżki w pliku do swoich wymagań)  

uruchamiamy watchdoga
---------------------
```
sudo modprobe bcm3510
sudo nano /etc/modules - na końcu dopisujemy bcm3510
sudo apt-get install watchdog chkconfig
sudo chkconfig watchdog on
sudo /etc/init.d/watchdog start
sudo update-rc.d watchdog defaults
sudo nano /etc/default/watchdog - zmieniamy watchdog_module=„none” na watchdog_module=„bcm3510”
sudo nano /etc/watchdog.conf zmieniamy usuwając # dla 
	watchdog-device = /dev/watchdog	
	max-load-1 = 24
sudo reboot
```
sprawdzanie
```
sudo /etc/init.d/watchdog status
```
jak leży to podnosimy 
```
sudo /etc/init.d/watchdog start
```
testujemy fork bombą
```
:(){ :|:& };:
```
po paru sekundach powinien nastąpić reset systemu


instalacja opencv
----------------
używam wersji 2.4.13 bo wersja 3.1 ponoć nie działa z nodejs
pobieramy ze strony
http://opencv.org/downloads.html
```
   tar xvzf opencv-2.4.13.tar.gz
   sudo apt-get install libgtk2.0 libgtk2.0-dev zlib1g-dev libpng-dev libjpeg-dev libtiff-dev  swig
   sudo apt-get install build-essential cmake pkg-config
   sudo apt-get install libjpeg8-dev libtiff4-dev libjasper-dev libpng12-dev
    sudo apt-get install libgtk2.0-dev
	sudo apt-get install libavcodec-dev libavformat-dev libswscale-dev libv4l-dev
    sudo apt-get install libatlas-base-dev gfortran
  cd opencv-2.4.5
  mkdir release
  cd release
  cmake -D CMAKE_BUILD_TYPE=RELEASE -D CMAKE_INSTALL_PREFIX=/usr/local .. 
make trwa długo to duży pakiet  
  make
  sudo make install
  sudo ldconfig
  make clean
```

serwer www
---------
działają dwa jeden dla kamery na porcie 8090 i drugi szata graficzna na porcie 8080 można sobie ustawić 80 na drugi, nie trzeba będzie podawać portu w adresie www.
Trzeba doinstalować zależności aby serwer www działał w tym celu w katalogu gdzie jest plik package.json  wywołujemy:
```
npm install
```


  
