📝 Documentación Técnica de Contexto: Proyecto "Dragon Platformer"
1. Resumen del Proyecto
Este es un juego de plataformas 2D desarrollado con Phaser 3 utilizando el motor de física Arcade. El juego presenta un mundo masivo de 12,800 píxeles de ancho con dos biomas diferenciados: Mundo Exterior y Cueva.

2. Arquitectura de Optimización (CRÍTICO)
Para mantener un rendimiento de 60 FPS en un mundo tan extenso, el código implementa las siguientes estrategias que NO deben ser revertidas:

Plataformas de Bloque Único: En lugar de crear cientos de sprites individuales de 32x32 para el suelo, el generador crea un solo objeto de plataforma y utiliza .setDisplaySize(width, height) y .refreshBody(). Esto reduce la carga del motor de física de miles de colisiones a solo unas pocas decenas.

Gestión de TileSprites: Los fondos (bgNubes, bgMontanas, etc.) tienen un tamaño fijo de 800x600 (el tamaño de la cámara). El efecto Parallax se logra moviendo la tilePositionX en lugar de crear imágenes gigantes. Esto evita el desbordamiento de memoria RAM.

Culling de Enemigos (IA en reposo): En el método update, los enemigos fuera del rango visible (scrollX) desactivan su velocidad (setVelocityX(0)). Solo procesan lógica de movimiento cuando están cerca del jugador.

Pool de Objetos: Las bolas de fuego (fireballs) utilizan un grupo con maxSize: 8 para reciclar proyectiles y evitar la creación/destrucción constante de objetos.

3. Mecánicas Principales
Sistema de Vidas: El jugador tiene 3 vidas representadas por corazones. Al recibir daño, se activa un estado de invencible (boolean) y un efecto visual de parpadeo (Tween) para evitar la pérdida múltiple de vidas en un solo frame.

Movimiento: Utiliza un sistema de Velocidad Directa para una respuesta instantánea y una Gravedad de 1200 para un salto con peso tipo "arcade".

Combate: * Ataque: Disparo de bolas de fuego (Tecla Espacio) con cooldown de 350ms.

Pisotón: Colisión desde arriba (velocity.y > 0) elimina al enemigo y da un impulso al jugador.

Transiciones: Las tuberías (pipes) funcionan mediante un sensor de traslape (overlap). Si el jugador pulsa "ABAJO" sobre ellas, se dispara un Tween de salida, se limpia la memoria del mundo actual (platforms.clear, etc.) y se ejecuta la función constructora del siguiente bioma.

4. Estructura de Generación de Niveles
El mapa se genera mediante un bucle while (currentX < TOTAL_WORLD_WIDTH).

Calcula un ancho aleatorio para una "isla".

Crea la plataforma física estirada.

Distribuye enemigos y monedas basados en probabilidades (Phaser.Math.Between).

Crea un "hueco" (precipicio) saltando el contador currentX.

5. Instrucciones para la IA Colaboradora
Fondo: Nunca cambies el ScrollFactor de los TileSprites de fondo; el parallax se maneja manualmente en el update.

Física: Si agregas nuevos objetos, asegúrate de añadirlos a los grupos de colisión existentes (physics.add.collider).

Escalado: El sprite del personaje está escalado a 0.17. Cualquier asset nuevo debe ajustarse proporcionalmente a este tamaño.

Limpieza: Al cambiar de mundo, es obligatorio llamar a .clear(true, true) en todos los grupos dinámicos para evitar fugas de memoria.