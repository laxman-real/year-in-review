#!/bin/zsh
# Render and encode all six Year in Review reels (P1, G1 x versions 1-3) in a separate render tab
Y="$(cd "$(dirname "$0")/.." && pwd)"; S="$(cd "$(dirname "$0")" && pwd)"
cd $S
A="[1:a]atrim=start=15.288:duration=28.0,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.12,afade=t=out:st=27.1:d=0.9,loudnorm=I=-14.5:TP=-2:LRA=11,alimiter=limit=0.75:level=false[a]"
for V in P1 G1; do
  for spec in "1||-v4|" "2|&v2|-version2|-v2" "3|&full|-version3-full|-v3"; do
    n=${spec%%|*}; rest=${spec#*|}; flag=${rest%%|*}; rest=${rest#*|}; exp=${rest%%|*}; med=${rest#*|}
    D=r6-$V-$n; rm -rf $D; SECONDS=0
    node render2.mjs $D 30 999 $V "$flag" 2>&1 | grep -E "retry|total|Error"
    echo "$V v$n: $(ls $D | wc -l) frames ${SECONDS}s"
    ffmpeg -v error -y -framerate 30 -i $D/f%04d.jpg -i "$Y/export/yir-reel-music-v1.mp3" -filter_complex "$A" -map 0:v -map "[a]" -vf "scale=in_range=pc:out_range=tv,format=yuv420p" -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:v libx264 -preset slow -crf 17 -profile:v high -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest "$Y/export/yir-reel-$V$exp.mp4" && \
    ffmpeg -v error -y -i "$Y/export/yir-reel-$V$exp.mp4" -c:v libx264 -preset slow -crf 21 -maxrate 3.6M -bufsize 7.2M -pix_fmt yuv420p -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -profile:v high -level 4.1 -c:a copy -movflags +faststart "$Y/media/yir-reel-$V$med.mp4" && \
    ffmpeg -v error -y -ss 5 -i "$Y/media/yir-reel-$V$med.mp4" -frames:v 1 -vf scale=200:-1 chk-$V-$n.jpg && echo "$V v$n encoded"
  done
done
ls -la "$Y/media"
