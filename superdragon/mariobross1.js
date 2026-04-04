// =====================================================================
// CONFIGURACIÓN GLOBAL DEL MOTOR PHASER
// =====================================================================
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#5c94fc',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1200 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        forceOrientation: true,
        orientation: 'landscape'
    },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

// =====================================================================
// VARIABLES GLOBALES
// =====================================================================
let player;
let cursors;
let platforms;
let coins;
let pipes;
let decoracionGroup;
let enemies;
let fireballs;
let bgCielo, bgNubes, bgMontanas1, bgMontanas2, bgMontanas3, bgArboles;
let fondoCueva1;
let esMundoCueva = false;

let score = 0;
let vidas = 5;
let pausado = false;
let juegoTerminado = false;
let lastFireTime = 0;
let shiftKey;
let fireKey;
const FIRE_COOLDOWN = 400;

// CONTROLES TÁCTILES
let touchLeft = false, touchRight = false, touchJump = false, touchFire = false, touchSprint = false;

let scoreText, vidasText, hudPausaBtn, hudReiniciarBtn, pantallaOverlay;

const SPEED_MAX = 300;
const ACCELERATION = 600;
const DRAG = 800;
const JUMP_FORCE = -720;

const TOTAL_WORLD_WIDTH = 12800;
const CAVE_WORLD_WIDTH = 6400;

// =====================================================================
// PRELOAD
// =====================================================================
function preload() {
    for (let i = 1; i <= 5; i++) this.load.image(`dragon${i}`, `frames/${i}.png`);
    this.load.image('cieloAzul', 'cielo/Looped Sky Background.png');
    this.load.image('nubeImg', 'nubes 2/nube1.png');
    this.load.image('arbolesImg', 'fondo arboles 2/arboles.png');
    this.load.image('montana1', 'montanas/1.png');
    this.load.image('montana2', 'montanas/2.png');
    this.load.image('montana3', 'montanas/3.png');
    this.load.image('fCueva1', 'cueva/fondocueva/Pixel Crystal Mine.png');
    this.load.image('hongo1', 'cueva/hongos/hongo1.png');
    this.load.image('hongo2', 'cueva/hongos/hongo2.png');
    this.load.image('hongo3', 'cueva/hongos/hongo3.png');

    let graphics = this.make.graphics();
    graphics.fillStyle(0xcc4c02, 1); graphics.fillRect(0, 0, 32, 32); graphics.lineStyle(2, 0x000000); graphics.strokeRect(0, 0, 32, 32); graphics.generateTexture('brick', 32, 32);
    graphics.clear(); graphics.fillStyle(0x4d4d4d, 1); graphics.fillRect(0, 0, 32, 32); graphics.lineStyle(2, 0x222222); graphics.strokeRect(0, 0, 32, 32); graphics.generateTexture('rock', 32, 32);
    graphics.clear(); graphics.fillStyle(0x00a800, 1); graphics.fillRect(0, 0, 64, 96); graphics.lineStyle(3, 0x004d00); graphics.strokeRect(0, 0, 64, 96); graphics.generateTexture('pipe', 64, 96);
    graphics.clear(); graphics.fillStyle(0xffff00, 1); graphics.fillCircle(15, 15, 15); graphics.fillStyle(0xffffff, 0.8); graphics.fillCircle(10, 10, 5); graphics.generateTexture('coin', 30, 30);
    graphics.clear(); graphics.fillStyle(0x33cc33, 1); graphics.fillEllipse(24, 28, 48, 40); graphics.fillStyle(0xffffff, 1); graphics.fillCircle(14, 22, 6); graphics.fillCircle(30, 22, 6); graphics.fillStyle(0x000000, 1); graphics.fillCircle(16, 22, 3); graphics.fillCircle(32, 22, 3); graphics.generateTexture('slime', 48, 48);
    graphics.clear(); graphics.fillStyle(0x553366, 1); graphics.fillTriangle(0, 24, 20, 0, 20, 24); graphics.fillTriangle(40, 24, 20, 0, 20, 24); graphics.fillStyle(0x7744aa, 1); graphics.fillCircle(20, 20, 10); graphics.generateTexture('bat', 40, 32);
    graphics.clear(); graphics.fillStyle(0xffa500, 1); graphics.fillCircle(10, 10, 10); graphics.generateTexture('fireball', 20, 20);
    graphics.clear(); graphics.fillStyle(0xff2244, 1); graphics.fillCircle(5, 5, 5); graphics.fillCircle(14, 5, 5); graphics.fillTriangle(0, 6, 19, 6, 9, 18); graphics.generateTexture('heart', 20, 18);
    graphics.destroy();
}

function create() {
    score = 0; vidas = 5; pausado = false; juegoTerminado = false;
    this.physics.world.setBounds(0, 0, TOTAL_WORLD_WIDTH, 2000);
    this.cameras.main.setBounds(0, 0, TOTAL_WORLD_WIDTH, 1000);

    platforms = this.physics.add.staticGroup();
    pipes = this.physics.add.staticGroup();
    coins = this.physics.add.group();
    enemies = this.physics.add.group({ collideWorldBounds: true });
    fireballs = this.physics.add.group({ defaultKey: 'fireball', maxSize: 10 });
    decoracionGroup = this.add.group();

    construirMundoExterior.call(this);

    player = this.physics.add.sprite(100, 400, 'dragon1').setScale(0.17).setCollideWorldBounds(true);
    player.body.setSize(320, 400).setOffset(550, 300);
    player.setMaxVelocity(SPEED_MAX, 1000).setDragX(DRAG);
    player.setDepth(10);
    player.setData('invencible', false);

    this.anims.create({
        key: 'walk',
        frames: [{ key: 'dragon1' }, { key: 'dragon2' }, { key: 'dragon3' }, { key: 'dragon4' }, { key: 'dragon5' }],
        frameRate: 12, repeat: -1
    });

    this.physics.add.collider(player, platforms);
    this.physics.add.collider(enemies, platforms);
    this.physics.add.collider(enemies, pipes);
    this.physics.add.collider(enemies, enemies);
    this.physics.add.collider(player, pipes, handlePipeEntry, null, this);
    this.physics.add.overlap(player, coins, (p, c) => { c.destroy(); score += 10; scoreText.setText('Puntos: ' + score); }, null, this);
    this.physics.add.overlap(player, enemies, handleEnemyCollision, null, this);
    this.physics.add.overlap(fireballs, enemies, (f, e) => { f.destroy(); e.destroy(); score += 50; scoreText.setText('Puntos: ' + score); }, null, this);
    this.physics.add.collider(fireballs, platforms, (f) => f.destroy());

    cursors = this.input.keyboard.createCursorKeys();
    shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.cameras.main.startFollow(player, true, 0.08, 0.08);
    crearHUD.call(this);

    if (this.sys.game.device.input.touch) {
        crearControlesTactiles.call(this);
    }
}

function update() {
    if (juegoTerminado || pausado) return;
    const isTouchingDown = player.body.touching.down || player.body.blocked.down;
    const scrollX = this.cameras.main.scrollX;
    if (player.y > 1000) { perderVida.call(this); }
    if (!esMundoCueva && bgNubes && bgNubes.active) {
        bgNubes.tilePositionX = scrollX * 0.1 + (this.time.now * 0.005);
        bgMontanas1.tilePositionX = scrollX * 0.2; bgMontanas2.tilePositionX = scrollX * 0.3;
        bgMontanas3.tilePositionX = scrollX * 0.4; bgArboles.tilePositionX = scrollX * 0.6;
    }
    if (Phaser.Input.Keyboard.JustDown(fireKey) || touchFire) {
        if (touchFire) touchFire = false;
        const ahora = this.time.now;
        if (ahora - lastFireTime > FIRE_COOLDOWN) { lastFireTime = ahora; lanzarFuego.call(this); }
    }
    const isSprinting = shiftKey.isDown || touchSprint;
    const currentAccel = isSprinting ? ACCELERATION * 2 : ACCELERATION;
    const currentMaxSpeed = isSprinting ? 500 : SPEED_MAX;
    player.setMaxVelocity(currentMaxSpeed, 1000);
    if (cursors.left.isDown || touchLeft) {
        player.setAccelerationX(-currentAccel); player.setFlipX(true);
        if (isTouchingDown) player.anims.play('walk', true);
    } else if (cursors.right.isDown || touchRight) {
        player.setAccelerationX(currentAccel); player.setFlipX(false);
        if (isTouchingDown) player.anims.play('walk', true);
    } else {
        player.setAccelerationX(0);
        if (isTouchingDown) {
            if (Math.abs(player.body.velocity.x) > 20) player.anims.play('walk', true);
            else { player.anims.stop(); player.setTexture('dragon1'); }
        }
    }
    if ((cursors.up.isDown || touchJump) && isTouchingDown) {
        player.setVelocityY(JUMP_FORCE);
        if (touchJump) touchJump = false;
    }
    if (!isTouchingDown) player.setTexture('dragon3');
    enemies.getChildren().forEach(e => {
        let dist = Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y);
        if (dist < 300) { e.setVelocityX(player.x < e.x ? -140 : 140); }
        e.setFlipX(e.body.velocity.x > 0);
    });
}

function construirMundoExterior() {
    esMundoCueva = false;
    this.physics.world.setBounds(0, 0, TOTAL_WORLD_WIDTH, 2000);
    this.cameras.main.setBounds(0, 0, TOTAL_WORLD_WIDTH, 1000);
    this.cameras.main.setBackgroundColor('#5c94fc');
    bgCielo = this.add.tileSprite(0, 0, 800, 1000, 'cieloAzul').setOrigin(0, 0).setScrollFactor(0).setDepth(-10);
    bgNubes = this.add.tileSprite(0, 0, TOTAL_WORLD_WIDTH, 200, 'nubeImg').setOrigin(0, 0).setScrollFactor(0.1).setDepth(-9);
    bgMontanas1 = this.add.tileSprite(0, 50, TOTAL_WORLD_WIDTH, 600, 'montana1').setOrigin(0, 0).setScrollFactor(0.2).setDepth(-8);
    bgMontanas2 = this.add.tileSprite(0, 200, TOTAL_WORLD_WIDTH, 600, 'montana2').setOrigin(0, 0).setScrollFactor(0.3).setDepth(-7);
    bgMontanas3 = this.add.tileSprite(0, 300, TOTAL_WORLD_WIDTH, 600, 'montana3').setOrigin(0, 0).setScrollFactor(0.4).setDepth(-6);
    bgArboles = this.add.tileSprite(0, 400, TOTAL_WORLD_WIDTH, 600, 'arbolesImg').setOrigin(0, 0).setScrollFactor(0.6).setDepth(-5);
    [bgCielo, bgNubes, bgMontanas1, bgMontanas2, bgMontanas3, bgArboles].forEach(bg => { if (bg) bg.setVisible(true); });
    if (fondoCueva1) fondoCueva1.setVisible(false);
    let currentX = 0; let groundY = 850;
    while (currentX < TOTAL_WORLD_WIDTH) {
        if (Phaser.Math.Between(0, 100) > 80) { groundY = Phaser.Math.Clamp(groundY + Phaser.Math.Between(-2, 2) * 32, 700, 950); }
        let islandWidth = Phaser.Math.Between(10, 40);
        for (let i = 0; i < islandWidth; i++) {
            let px = currentX + i * 32 + 16;
            if (px > TOTAL_WORLD_WIDTH) break;
            platforms.create(px, groundY, 'brick');
            if (currentX > 500 && Phaser.Math.Between(0, 100) > 95) { enemies.create(px, groundY - 40, 'slime'); }
            if (Phaser.Math.Between(0, 10) > 8) { crearMoneda(this, px, groundY - 100); }
        }
        currentX += islandWidth * 32 + Phaser.Math.Between(100, 250);
    }
    for (let k = 0; k < 70; k++) {
        let x = Phaser.Math.Between(500, TOTAL_WORLD_WIDTH - 500);
        let y = Phaser.Math.Between(100, 750);
        let anchoIsla = Phaser.Math.Between(3, 7);
        for (let i = 0; i < anchoIsla; i++) { platforms.create(x + (i * 32), y, 'brick'); }
        if (Phaser.Math.Between(0, 10) > 6) { enemies.create(x + (Math.floor(anchoIsla / 2) * 32), y - 40, 'slime'); }
        if (Phaser.Math.Between(0, 10) > 4) { crearMoneda(this, x + (Phaser.Math.Between(0, anchoIsla - 1) * 32), y - 50); }
    }
    pipes.create(TOTAL_WORLD_WIDTH - 200, groundY - 48, 'pipe').setData('tipo', 'entrar');
}

function construirMundoCueva() {
    esMundoCueva = true;
    this.physics.world.setBounds(0, 0, CAVE_WORLD_WIDTH, 2000);
    this.cameras.main.setBounds(0, 0, CAVE_WORLD_WIDTH, 1000);
    this.cameras.main.setBackgroundColor('#000000');
    [bgCielo, bgNubes, bgMontanas1, bgMontanas2, bgMontanas3, bgArboles].forEach(bg => { if (bg) bg.setVisible(false); });
    if (!fondoCueva1) { fondoCueva1 = this.add.tileSprite(0, 0, CAVE_WORLD_WIDTH, 1000, 'fCueva1').setOrigin(0, 0).setScrollFactor(0.5).setDepth(-5); }
    else { fondoCueva1.setVisible(true).setSize(CAVE_WORLD_WIDTH, 1000); }
    let currentX = 0; let groundY = 850;
    while (currentX < CAVE_WORLD_WIDTH) {
        if (Phaser.Math.Between(0, 100) > 80) { groundY = Phaser.Math.Clamp(groundY + Phaser.Math.Between(-2, 2) * 32, 700, 950); }
        let islandWidth = Phaser.Math.Between(10, 40);
        for (let i = 0; i < islandWidth; i++) {
            let px = currentX + i * 32 + 16;
            if (px > CAVE_WORLD_WIDTH) break;
            platforms.create(px, groundY, 'rock');
            if (Phaser.Math.Between(0, 100) > 90) {
                let hongoKey = `hongo${Phaser.Math.Between(1, 3)}`;
                let prof = (Math.random() > 0.7) ? 20 : -1;
                crearHongoPersonalizado(this, px, groundY + 15, hongoKey, Phaser.Math.FloatBetween(0.6, 1.5), prof, 1, Math.random() > 0.5);
            }
            if (Phaser.Math.Between(0, 10) > 8) { crearMoneda(this, px, groundY - 100); }
        }
        currentX += islandWidth * 32 + Phaser.Math.Between(100, 200);
    }
    [500, 1500, 2500, CAVE_WORLD_WIDTH - 1000].forEach(x => { let b = enemies.create(x, 200, 'bat'); b.body.allowGravity = false; });
    pipes.create(CAVE_WORLD_WIDTH - 200, groundY - 48, 'pipe').setData('tipo', 'salir');
}

function crearMoneda(escena, x, y) {
    let moneda = coins.create(x, y, 'coin').setScale(1.5).setCircle(15).setBounce(0.8);
    moneda.body.allowGravity = false;
    escena.tweens.add({ targets: moneda, y: y - 25, duration: 2000 + Math.random() * 1000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    escena.tweens.add({ targets: moneda, scaleX: -1.5, duration: 800, ease: 'Linear', yoyo: true, repeat: -1 });
}

function crearHongoPersonalizado(escena, x, y, key, escala = 1, profundidad = -1, opacidad = 1, volteado = false) {
    let hongo = escena.add.image(x, y, key).setOrigin(0.5, 1).setScale(escala).setDepth(profundidad).setAlpha(opacidad).setFlipX(volteado);
    decoracionGroup.add(hongo);
}

function perderVida() {
    if (player.getData('invencible')) return;
    vidas--; actualizarVidasHUD.call(this);
    this.cameras.main.shake(300, 0.02);
    if (vidas <= 0) { gameOver.call(this); }
    else {
        player.setTint(0xff0000); player.setData('invencible', true); player.setPosition(player.x - 200, 400); player.setVelocity(0, 0);
        this.time.delayedCall(1500, () => { player.clearTint(); player.setAlpha(1); player.setData('invencible', false); });
    }
}

function handleEnemyCollision(p, e) {
    if (p.getData('invencible')) return;
    if (p.body.velocity.y > 0 && p.y < e.y - 10) { e.destroy(); p.setVelocityY(-450); score += 100; scoreText.setText('Puntos: ' + score); }
    else { perderVida.call(this); p.setVelocity(p.x < e.x ? -600 : 600, -300); p.setAlpha(0.5); }
}

function crearHUD() {
    this.add.rectangle(0, 0, 800, 48, 0x000000, 0.45).setOrigin(0, 0).setScrollFactor(0).setDepth(100);
    scoreText = this.add.text(16, 12, 'Puntos: 0', { fontSize: '20px', fill: '#ffffff' }).setScrollFactor(0).setDepth(101);
    actualizarVidasHUD.call(this);
    hudPausaBtn = this.add.text(680, 12, '⏸ Pausa', { fontSize: '16px', fill: '#ffffff', backgroundColor: '#333333', padding: { x: 8, y: 4 } }).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });
    hudPausaBtn.on('pointerdown', () => togglePausa.call(this));
    hudReiniciarBtn = this.add.text(570, 12, '↺ Reset', { fontSize: '16px', fill: '#ffffff', backgroundColor: '#333333', padding: { x: 8, y: 4 } }).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });
    hudReiniciarBtn.on('pointerdown', () => { location.reload(); });
    let skipNivel2 = this.add.text(450, 12, '⏩ Nivel 2', { fontSize: '16px', fill: '#ffff00', backgroundColor: '#333333', padding: { x: 8, y: 4 } }).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });
    skipNivel2.on('pointerdown', () => {
        platforms.clear(true, true); pipes.clear(true, true); coins.clear(true, true); enemies.clear(true, true); decoracionGroup.clear(true, true);
        construirMundoCueva.call(this); player.setPosition(200, 400); player.setAlpha(1);
    });
}

function actualizarVidasHUD() {
    if (this._hearts) this._hearts.forEach(h => h.destroy());
    this._hearts = [];
    for (let i = 0; i < vidas; i++) { this._hearts.push(this.add.image(310 + i * 28, 24, 'heart').setScrollFactor(0).setDepth(101).setScale(1.1)); }
}

function gameOver() {
    juegoTerminado = true; this.physics.pause(); player.setTint(0xff4444); player.setVisible(false);
    mostrarOverlay.call(this, '💀 GAME OVER', '¡Derrotado!');
    this.add.text(400, 350, '↺ Haz Reset para reintentar', { fontSize: '18px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
}

function lanzarFuego() {
    let fb = fireballs.get(player.x, player.y);
    if (fb) { fb.setActive(true).setVisible(true).body.allowGravity = false; fb.setVelocityX(player.flipX ? -600 : 600); this.time.delayedCall(1500, () => fb.destroy()); }
}

function handlePipeEntry(player, pipe) {
    if (cursors.down.isDown) {
        let accion = pipe.getData('tipo');
        this.tweens.add({
            targets: player, alpha: 0, y: pipe.y + 60, duration: 400,
            onComplete: () => {
                platforms.clear(true, true); pipes.clear(true, true); coins.clear(true, true); enemies.clear(true, true); decoracionGroup.clear(true, true);
                if (accion === 'entrar') { construirMundoCueva.call(this); player.setPosition(200, 400); }
                else { construirMundoExterior.call(this); player.setPosition(100, 600); }
                player.setAlpha(1);
            }
        });
    }
}

function mostrarOverlay(titulo, subtitulo) {
    if (pantallaOverlay) pantallaOverlay.destroy();
    let bg = this.add.rectangle(400, 300, 500, 220, 0x000000, 0.8).setScrollFactor(0).setDepth(110);
    let tit = this.add.text(400, 230, titulo, { fontSize: '36px', fill: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
    let sub = this.add.text(400, 285, subtitulo, { fontSize: '16px', fill: '#cccccc' }).setOrigin(0.5).setScrollFactor(0).setDepth(111);
    pantallaOverlay = this.add.group([bg, tit, sub]);
}

function togglePausa() {
    pausado = !pausado;
    if (pausado) { this.physics.pause(); hudPausaBtn.setText('▶ Jugar'); mostrarOverlay.call(this, '⏸ PAUSA', 'Presiona el botón para continuar'); }
    else { this.physics.resume(); hudPausaBtn.setText('⏸ Pausa'); if (pantallaOverlay) pantallaOverlay.destroy(true); }
}

function crearControlesTactiles() {
    const btnAlpha = 0.45;
    const btnColor = 0x333333;
    const createBtn = (x, y, radius, label, callbackDown, callbackUp) => {
        let circle = this.add.circle(x, y, radius, btnColor, btnAlpha).setScrollFactor(0).setDepth(200).setInteractive();
        this.add.text(x, y, label, { fontSize: '28px', fill: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
        circle.on('pointerdown', (ptr) => { circle.setAlpha(0.8); callbackDown(); });
        if (callbackUp) {
            const release = () => { circle.setAlpha(btnAlpha); callbackUp(); };
            circle.on('pointerup', release); circle.on('pointerout', release);
        }
        return circle;
    };
    const jX = 120, jY = 480, jRadius = 70;
    let base = this.add.circle(jX, jY, jRadius, 0x444444, 0.3).setScrollFactor(0).setDepth(200);
    let handle = this.add.circle(jX, jY, 35, 0x888888, 0.6).setScrollFactor(0).setDepth(201);
    let catchArea = this.add.circle(jX, jY, jRadius * 1.5, 0xffffff, 0).setScrollFactor(0).setDepth(202).setInteractive();
    catchArea.on('pointermove', (ptr) => {
        if (!ptr.isDown) return;
        let dist = Phaser.Math.Distance.Between(jX, jY, ptr.x, ptr.y);
        let angle = Phaser.Math.Angle.Between(jX, jY, ptr.x, ptr.y);
        let moveDist = Math.min(dist, jRadius);
        handle.x = jX + Math.cos(angle) * moveDist;
        handle.y = jY + Math.sin(angle) * moveDist;
        if (moveDist > 20) {
            let deg = Phaser.Math.RadToDeg(angle);
            touchLeft = (deg > 110 || deg < -110);
            touchRight = (deg > -70 && deg < 70);
        } else { touchLeft = false; touchRight = false; }
    });
    const resetJoystick = () => { handle.x = jX; handle.y = jY; touchLeft = false; touchRight = false; };
    catchArea.on('pointerup', resetJoystick);
    catchArea.on('pointerout', resetJoystick);
    createBtn(710, 500, 55, '⇑', () => touchJump = true, () => touchJump = false);
    createBtn(590, 510, 45, '🔥', () => touchFire = true, () => touchFire = false);
    createBtn(710, 380, 40, '⚡', () => touchSprint = true, () => touchSprint = false);
    createBtn(730, 80, 35, '⏸', () => togglePausa.call(this));
    createBtn(650, 80, 35, '↺', () => location.reload());
    createBtn(570, 80, 35, '⛶', () => {
        if (this.scale.isFullscreen) this.scale.stopFullscreen();
        else { this.scale.startFullscreen(); this.scale.refresh(); }
    });
}