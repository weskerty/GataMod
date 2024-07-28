rm -rf whisper.cpp
apt-get install git curl wget make build-essential cmake ffmpeg libopenblas-base -y > /dev/null 2>&1
git clone https://github.com/ggerganov/whisper.cpp.git > /dev/null 2>&1
cp ../src/RecursosMarcoRota/PluginsMovibles/main.cpp whisper.cpp
cd whisper.cpp
./models/download-ggml-model.sh small > /dev/null 2>&1
g++ -std=c++17 -o main main.cpp -lstdc++fs -pthread > /dev/null 2>&1
cd ../ && chmod +x src/RecursosMarcoRota/ScriptActivo/whispercppAllT.sh
cp src/RecursosMarcoRota/PluginsMovibles/txtAllTime.js plugins/txtAllTime.js
echo Si todo salio bien, el bot deberia transcribir audios con .txt Esta funcion utiliza muchos recursos, es viable en VPS locales. La precisin y velocidad pueden ser mayores haciendo unos cambios en el script whispercppAllT.sh. La documentacion en https://github.com/ggerganov/whisper.cpp