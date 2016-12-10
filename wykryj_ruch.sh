#!/bin/bash
### BEGIN INIT INFO
# Provides:          wykryj_ruch.sh 
# Required-Start:    $local_fs $network
# Required-Stop:     $local_fs
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: wykryj_ruch.sh 
# Description:       wykryj_ruch
### END INIT INFO

EXE=/home/pi/robot/opencv_ruch/wykryj
USER=pi
#OUT=/dev/null
OUT=/tmp/wykryj_ruch.txt

case "$1" in

start)
    echo "starting wykrywania ruchu: $EXE"

    sudo -u $USER $EXE  > $OUT 2>$OUT & 
    ;;

stop)
    killall $EXE
    ;;

*)
    echo "usage: $0 (start|stop)"
esac

exit 0
