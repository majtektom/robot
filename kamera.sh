#!/bin/bash
### BEGIN INIT INFO
# Provides:          kamera.sh 
# Required-Start:    $local_fs $network
# Required-Stop:     $local_fs
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: kamera.sh 
# Description:       kamera
### END INIT INFO

MJPG=/home/pi/mjpg-streamer/mjpg_streamer
USER=pi
#OUT=/dev/null
OUT=/tmp/kamera_log.txt

case "$1" in

start)
    echo "starting video striming: $MJPG"
    #strumin do sieci z haslem na porcie 8090 
    # migawki do plikuw w katalogu -f /tmp   co -d 500 -> 500ms   -s 8 -> obrazow w petli
    # wejscie obrazu -r 300x300 pixeli -ftp 10 klatek na sekunde -y przestrzen kolorow  YUYV
    sudo -u $USER $MJPG \
      -o "/home/pi/mjpg-streamer/output_http.so -c pi:123 -p 8090 -w /home/pi/mjpg-streamer/www" \
      -o "/home/pi/mjpg-streamer/output_file.so -f /tmp -d 500 -s 8" \
      -i "/home/pi/mjpg-streamer/input_uvc.so -fps 10 -r 300x300 -y" \
       > $OUT 2>$OUT & 
    ;;

stop)
    killall $MJPG
    ;;

*)
    echo "usage: $0 (start|stop)"
esac

exit 0
