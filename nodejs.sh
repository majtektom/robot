#!/bin/bash
### BEGIN INIT INFO
# Provides:          nodejs.sh
# Required-Start:    $local_fs $network
# Required-Stop:     $local_fs
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: nodejs.sh
# Description:       node
### END INIT INFO

NODE=/opt/node/bin/node
SERVER_JS_FILE=/home/pi/robot/serwer.js
USER=pi
OUT=/dev/null

case "$1" in

start)
    echo "starting node: $NODE $SERVER_JS_FILE"
    sudo -u $USER $NODE $SERVER_JS_FILE > $OUT 2>$OUT &
    ;;

stop)
    killall $NODE
    ;;

*)
    echo "usage: $0 (start|stop)"
esac

exit 0
