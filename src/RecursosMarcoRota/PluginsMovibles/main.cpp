#include <iostream>
#include <filesystem>
#include <chrono>
#include <thread>
#include <fstream>
#include "whisper.h"

namespace fs = std::filesystem;

void process_audio_file(const std::string& file_path) {
    whisper_model * model = whisper_model_load("models/ggml-small.bin");
    if (model == nullptr) {
        std::cerr << "Error al cargar el modelo." << std::endl;
        return;
    }

    // Configurar los parámetros de transcripción
    whisper_full_params params = whisper_full_default_params(WHISPER_SAMPLING_STRATEGY_GREEDY);
    params.language = "es";
    params.num_threads = 15;

    // Procesar el archivo de audio
    if (!whisper_full(model, file_path.c_str(), params)) {
        std::cerr << "Error al procesar el archivo de audio." << std::endl;
    }

    // Limpiar
    whisper_model_free(model);
}

int main(int argc, char** argv) {
    // Archivo de bloqueo
    std::string lock_file = "whisper_lock.lock";

    // Intentar crear el archivo de bloqueo
    std::ofstream lock(lock_file);
    if (!lock) {
        std::cerr << "No se pudo crear el archivo de bloqueo. Asegúrate de que otra instancia no esté en ejecución." << std::endl;
        return 1;
    }

    // Directorio de entrada
    std::string input_directory = "../tmp/";

    // Bucle infinito para monitorear la carpeta y procesar archivos
    while (true) {
        for (const auto& entry : fs::directory_iterator(input_directory)) {
            if (entry.path().extension() == ".wav") {
                std::string file_path = entry.path().string();
                std::cout << "Procesando archivo: " << file_path << std::endl;

                // Procesar el archivo de audio
                process_audio_file(file_path);

                // Eliminar el archivo después de procesarlo
                fs::remove(file_path);
            }
        }

        // Esperar antes de volver a verificar la carpeta
        std::this_thread::sleep_for(std::chrono::seconds(5));
    }

    // Eliminar el archivo de bloqueo al salir
    fs::remove(lock_file);

    return 0;
}
