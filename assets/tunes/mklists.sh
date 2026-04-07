#!/usr/bin/env bash

directories=("rtttl");
echo "" > fileList.txt;
IFS=$'\n'
for dir in $directories; do
	echo $dir;
	for file in $(ls -1 $dir/*); do
		echo $file >> fileList.txt;
	done;
done;
