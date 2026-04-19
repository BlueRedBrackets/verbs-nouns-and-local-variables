namespace SpriteKind {
    export const Particle = SpriteKind.create()
    export const StruckProjectile = SpriteKind.create()
    export const StruckEnemy = SpriteKind.create()
    export const AvionicsDisplay = SpriteKind.create()
}
function hypotenuse (a: number, b: number) {
    return Math.sqrt(a ** 2 + b ** 2)
}
function rotatedVector (x: number, y: number, rotateByRadians: number) {
    toUnitVector(toRadians(x, y) + rotateByRadians)
    objects.setLocal("__rotatedVector_hypotenuse", Math.abs(hypotenuse(x, y)))
    objects.setLocal("__resultX", objects.getLocal("__resultX") * objects.getLocal("__rotatedVector_hypotenuse"))
    objects.setLocal("__resultY", objects.getLocal("__resultY") * objects.getLocal("__rotatedVector_hypotenuse"))
}
function rotatedRadians (radians: number, rotateByRadians: number) {
    return Math.abs(radians + rotateByRadians) % (2 * Math.PI)
}
function defineWeapons () {
    objects.defineNoun("Pellet", function () {
        objects.defineNew("x, y, direction, damage", function () {
            objects.setLocal("speed", 100)
            objects.setInstanceSprite(sprites.create(assets.image`pixel`, SpriteKind.Projectile), objects.self())
            objects.getSpriteFromNoun(objects.self()).x = objects.getLocal("x")
            objects.getSpriteFromNoun(objects.self()).y = objects.getLocal("y")
            toUnitVector(objects.getLocal("direction"))
            objects.getSpriteFromNoun(objects.self()).vx = objects.getLocal("__resultX") * objects.getLocal("speed")
            objects.getSpriteFromNoun(objects.self()).vy = objects.getLocal("__resultY") * objects.getLocal("speed")
            objects.getSpriteFromNoun(objects.self()).lifespan = 5000
            objects.getSpriteFromNoun(objects.self()).image.fill(1)
            music.play(music.createSoundEffect(WaveShape.Noise, 2252, 627, 255, 0, 50, SoundExpressionEffect.Warble, InterpolationCurve.Logarithmic), music.PlaybackMode.InBackground)
        })
    })
}
function toUnitVector (directionRadians: number) {
    objects.setLocal("__resultX", Math.cos(directionRadians))
    objects.setLocal("__resultY", Math.sin(directionRadians))
}
function definePilot () {
    objects.defineNoun("AvionicsDisplay", function () {
        objects.defineNew("", function () {
            objects.setInstanceProperty(objects.self(), "hullIndicator", objects.newNewInstance("BarIndicator", 0, 0, 64, 4, true))
            objects.setInstanceProperty(objects.self(), "fuelIndicator", objects.newNewInstance("BarIndicator", scene.screenWidth() - 64, 0, 64, 4, false))
        })
        objects.defineAritousVerb("updateFuel", "current, max", function () {
            objects.tell(objects.getInstanceProperty(objects.self(), "fuelIndicator"), "updatePercentage", objects.getLocal("current"), objects.getLocal("max"))
        })
        objects.defineAritousVerb("updateHull", "current, max", function () {
            objects.tell(objects.getInstanceProperty(objects.self(), "hullIndicator"), "updatePercentage", objects.getLocal("current"), objects.getLocal("max"))
        })
    })
    objects.defineNoun("Pilot", function () {
        objects.defineNew("flightControl, weaponsControl", function () {
        	
        })
        objects.onTick(objects.everyFrame(), function () {
            objects.setLocal("controllerX", Math.map(controller.dx(), -3, 3, -1, 1))
            objects.setLocal("controllerY", Math.map(controller.dy(), -3, 3, 1, -1))
            if (isAnyDirectionPressed()) {
                objects.tell(objects.getInstanceProperty(objects.self(), "flightControl"), "flyToward", objects.getLocal("controllerX"), objects.getLocal("controllerY"))
            } else {
                objects.tell(objects.getInstanceProperty(objects.self(), "flightControl"), "standby")
            }
            if (controller.A.isPressed()) {
                objects.tell(objects.getInstanceProperty(objects.self(), "weaponsControl"), "fire")
            }
        })
    })
}
function differenceInRadians (radians: number, targetRadians: number) {
    objects.setLocal("__differenceInRadians_result", Math.abs(radians - targetRadians) % (2 * Math.PI))
    if (objects.getLocal("__differenceInRadians_result") > Math.PI) {
        objects.setLocal("__differenceInRadians_result", 2 * Math.PI - objects.getLocal("__differenceInRadians_result"))
    }
    return objects.getLocal("__differenceInRadians_result")
}
function defineHull () {
    objects.defineNoun("Hull", function () {
        objects.defineNew("avionicsDisplay", function () {
            objects.setInstanceProperty(objects.self(), "maxStrength", 100)
            objects.setInstanceProperty(objects.self(), "strength", objects.getInstanceProperty(objects.self(), "maxStrength"))
            objects.tell(objects.getLocal("avionicsDisplay"), "updateHull", objects.getInstanceProperty(objects.self(), "strength"), objects.getInstanceProperty(objects.self(), "maxStrength"))
        })
        objects.defineAritousVerb("damage", "amount", function () {
            objects.setInstanceProperty(objects.self(), "strength", objects.getInstanceProperty(objects.self(), "strength") - objects.getLocal("amount"))
            objects.tell(objects.getLocal("avionicsDisplay"), "updateHull", objects.getInstanceProperty(objects.self(), "strength"), objects.getInstanceProperty(objects.self(), "maxStrength"))
        })
    })
}
function isAnyDirectionPressed () {
    return controller.left.isPressed() || (controller.right.isPressed() || (controller.up.isPressed() || controller.down.isPressed()))
}
function toRadians (x: number, y: number) {
    return Math.atan2(y * -1, x)
}
function defineFlightControl () {
    objects.defineNoun("FlightControl", function () {
        objects.defineNew("ship", function () {
            objects.setInstanceProperty(objects.self(), "engine", objects.newNewInstance("Engine", 2, 300, objects.getLocal("ship")))
            objects.setInstanceProperty(objects.self(), "attitude", objects.getSpriteFromNoun(objects.getLocal("ship")).rotation)
        })
        objects.defineNullaryVerb("standby", function () {
            objects.tell(objects.getInstanceProperty(objects.self(), "engine"), "stop")
        })
        objects.defineAritousVerb("flyToward", "dx, dy", function () {
            if (objects.ask(objects.getInstanceProperty(objects.self(), "engine"), "haveFuel?")) {
                objects.setLocal("targetAttitude", toRadians(objects.getLocal("dx"), objects.getLocal("dy")))
                objects.setInstanceProperty(objects.self(), "attitude", objects.lerpRadians(objects.getInstanceProperty(objects.self(), "attitude"), objects.getLocal("targetAttitude"), 0.1))
                objects.tell(objects.getInstanceProperty(objects.self(), "ship"), "reorient", objects.getInstanceProperty(objects.self(), "attitude"))
                if (differenceInRadians(objects.getInstanceProperty(objects.self(), "attitude"), objects.getLocal("targetAttitude")) <= Math.PI / 16) {
                    objects.tell(objects.getInstanceProperty(objects.self(), "engine"), "start")
                }
            }
        })
    })
}
function defineEngine () {
    objects.defineNoun("Engine", function () {
        objects.defineNew("power, maxFuel, ship", function () {
            objects.setInstanceProperty(objects.self(), "avionicsDisplay", objects.getInstanceProperty(objects.getLocal("ship"), "avionicsDisplay"))
            objects.setInstanceProperty(objects.self(), "fuel", objects.getLocal("maxFuel"))
            objects.setState(objects.self(), "idle")
            objects.answer(objects.self())
        })
        objects.onTickInState(300, "running", function () {
            music.play(music.createSoundEffect(WaveShape.Noise, 276, 320, 28, 45, 300, SoundExpressionEffect.None, InterpolationCurve.Logarithmic), music.PlaybackMode.InBackground)
        })
        objects.onTickInState(objects.everyFrame(), "running", function () {
            if (objects.asBinary(objects.ask(objects.self(), "haveFuel?"))) {
                objects.setInstanceProperty(objects.self(), "fuel", objects.getInstanceProperty(objects.self(), "fuel") - 1)
                objects.tell(objects.getInstanceProperty(objects.self(), "ship"), "thrust", objects.getInstanceProperty(objects.self(), "power"))
                objects.tell(objects.getInstanceProperty(objects.getInstanceProperty(objects.self(), "ship"), "avionicsDisplay"), "updateFuel", objects.getInstanceProperty(objects.self(), "fuel"), objects.getInstanceProperty(objects.self(), "maxFuel"))
            } else {
                objects.tell(objects.self(), "stop")
            }
        })
        objects.defineNullaryVerb("start", function () {
            if (objects.asBinary(objects.ask(objects.self(), "haveFuel?"))) {
                objects.setState(objects.self(), "running")
            }
        })
        objects.defineNullaryVerb("stop", function () {
            objects.setState(objects.self(), "idle")
        })
        objects.defineNullaryVerb("haveFuel?", function () {
            objects.answer(objects.getInstanceProperty(objects.self(), "fuel") > 0)
        })
    })
}
function degreesToRadians (degrees: number) {
    return degrees * Math.PI / 180
}
info.onLifeZero(function () {
    music.stopAllSounds()
    game.reset()
})
function defineWeaponsControl () {
    objects.defineNoun("WeaponsControl", function () {
        objects.defineNew("ship", function () {
            objects.setInstanceProperty(objects.self(), "ammunition", "Pellet")
        })
        objects.defineAritousVerb("fire", "", function () {
            objects.setLocal("shipX", objects.getSpriteFromNoun(objects.getInstanceProperty(objects.self(), "ship")).x)
            objects.setLocal("shipY", objects.getSpriteFromNoun(objects.getInstanceProperty(objects.self(), "ship")).y)
            objects.setLocal("shipRadians", objects.getSpriteFromNoun(objects.getInstanceProperty(objects.self(), "ship")).rotation)
            objects.spawn(objects.getInstanceProperty(objects.self(), "ammunition"), objects.getLocal("shipX"), objects.getLocal("shipY"), objects.getLocal("shipRadians"), 10)
        })
    })
}
function defineShip () {
    objects.defineNoun("Ship", function () {
        objects.defineNew("", function () {
            objects.setInstanceSprite(sprites.create(assets.image`ship`, SpriteKind.Player), objects.self())
            objects.getSpriteFromNoun(objects.self()).rotationDegrees = -90
            objects.getSpriteFromNoun(objects.self()).setStayInScreen(true)
            objects.getSpriteFromNoun(objects.self()).setBounceOnWall(true)
            objects.setInstanceProperty(objects.self(), "avionicsDisplay", objects.newNewInstance("AvionicsDisplay"))
            objects.setInstanceProperty(objects.self(), "flightControl", objects.newNewInstance("FlightControl", objects.self()))
            objects.setInstanceProperty(objects.self(), "weaponsControl", objects.newNewInstance("WeaponsControl", objects.self()))
            objects.setInstanceProperty(objects.self(), "pilot", objects.newNewInstance("Pilot", objects.getInstanceProperty(objects.self(), "flightControl"), objects.getInstanceProperty(objects.self(), "weaponsControl")))
            objects.setInstanceProperty(objects.self(), "hull", objects.newNewInstance("Hull", objects.getInstanceProperty(objects.self(), "avionicsDisplay")))
        })
        objects.defineAritousVerb("reorient", "radians", function () {
            objects.getSpriteFromNoun(objects.self()).rotation = objects.getLocal("radians")
        })
        objects.defineAritousVerb("thrust", "power", function () {
            toUnitVector(objects.getSpriteFromNoun(objects.self()).rotation)
            objects.getSpriteFromNoun(objects.self()).vx += objects.getLocal("__resultX") * objects.getLocal("power")
            objects.getSpriteFromNoun(objects.self()).vy += objects.getLocal("__resultY") * objects.getLocal("power")
            objects.setLocal("particleSpeed", objects.getLocal("power") * 50)
            for (let index = 0; index <= 4; index++) {
                rotatedVector(-8, randint(-2, 2), objects.getSpriteFromNoun(objects.self()).rotation)
                objects.setLocal("xSpawn", objects.getSpriteFromNoun(objects.self()).x + objects.getLocal("__resultX"))
                objects.setLocal("ySpawn", objects.getSpriteFromNoun(objects.self()).y + objects.getLocal("__resultY"))
                toUnitVector(objects.getSpriteFromNoun(objects.self()).rotation)
                objects.setLocal("xVelocity", objects.getLocal("__resultX") * objects.getLocal("particleSpeed") * (randint(8, 11) / -10))
                objects.setLocal("yVelocity", objects.getLocal("__resultY") * objects.getLocal("particleSpeed") * (randint(8, 11) / -10))
                objects.tell(objects.newInstance("Particle"), "spawn", 1, objects.getLocal("xSpawn"), objects.getLocal("ySpawn"), objects.getLocal("xVelocity"), objects.getLocal("yVelocity"), randint(100, 300))
            }
        })
        objects.defineAritousVerb("equip", "weapon", function () {
            objects.setInstanceProperty(objects.self(), "weapon", objects.getLocal("weapon"))
            objects.setInstanceProperty(objects.getLocal("weapon"), "ship", objects.self())
        })
        objects.defineAritousVerb("struck", "damage", function () {
            objects.tell(objects.getInstanceProperty(objects.self(), "hull"), "damage", objects.getLocal("damage") * -1)
        })
        objects.defineNullaryVerb("fire", function () {
            objects.tell(objects.getInstanceProperty(objects.self(), "weapon"), "shoot", objects.getSpriteFromNoun(objects.self()).x, objects.getSpriteFromNoun(objects.self()).y, objects.getSpriteFromNoun(objects.self()).rotation)
        })
    })
}
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (sprite, otherSprite) {
    sprite.setKind(SpriteKind.StruckProjectile)
    objects.tell(objects.getNounFromSprite(otherSprite), "struckBy", objects.getNounFromSprite(sprite))
    sprites.destroy(sprite)
})
function defineMisc () {
    objects.defineNoun("Particle", function () {
        objects.defineAritousVerb("spawn", "color, x, y, vx, vy, lifespan", function () {
            objects.setInstanceSprite(sprites.create(assets.image`pixel`, SpriteKind.Particle), objects.self())
            objects.getSpriteFromNoun(objects.self()).image.fill(objects.getLocal("color"))
            objects.getSpriteFromNoun(objects.self()).x = objects.getLocal("x")
            objects.getSpriteFromNoun(objects.self()).y = objects.getLocal("y")
            objects.getSpriteFromNoun(objects.self()).vx = objects.getLocal("vx")
            objects.getSpriteFromNoun(objects.self()).vy = objects.getLocal("vy")
            objects.getSpriteFromNoun(objects.self()).lifespan = objects.getLocal("lifespan")
            objects.answer(objects.self())
        })
    })
    objects.defineNoun("BarIndicator", function () {
        objects.defineNew("x, y, width, height, anchorRight", function () {
            objects.setInstanceSprite(sprites.create(image.create(objects.getLocal("width"), objects.getLocal("height")), SpriteKind.AvionicsDisplay), objects.self())
            objects.getSpriteFromNoun(objects.self()).x = objects.getLocal("x") + objects.getLocal("width") / 2
            objects.getSpriteFromNoun(objects.self()).y = objects.getLocal("y") + objects.getLocal("height") / 2
            objects.getSpriteFromNoun(objects.self()).image.fill(1)
        })
        objects.defineAritousVerb("updatePercentage", "current, max", function () {
            objects.getSpriteFromNoun(objects.self()).image.fillRect(1, 1, objects.getInstanceProperty(objects.self(), "width") - 2, objects.getInstanceProperty(objects.self(), "height") - 2, 0)
            objects.setLocal("width", objects.getLocal("current") / objects.getLocal("max") * (objects.getInstanceProperty(objects.self(), "width") - 2))
            objects.getSpriteFromNoun(objects.self()).image.fillRect(1, 1, objects.getLocal("width"), objects.getInstanceProperty(objects.self(), "height") - 2, 1)
            if (objects.asBinary(objects.getInstanceProperty(objects.self(), "anchorRight"))) {
                objects.getSpriteFromNoun(objects.self()).image.flipX()
            }
        })
    })
}
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    otherSprite.setKind(SpriteKind.StruckEnemy)
    objects.tell(objects.getNounFromSprite(sprite), "struckBy", objects.getNounFromSprite(otherSprite))
    sprites.destroy(otherSprite)
})
function defineEnemies () {
    objects.defineNoun("Astroid", function () {
        objects.defineAritousVerb("spawn", "x, y, vx, vy, size", function () {
            objects.setLocal("astroidImages", [assets.image`astroid-a`, assets.image`astroid-b`, assets.image`astroid-c`])
            objects.setInstanceSprite(sprites.create(objects.asArray(objects.getLocal("astroidImages"))._pickRandom(), SpriteKind.Enemy), objects.self())
            objects.getSpriteFromNoun(objects.self()).setStayInScreen(true)
            objects.getSpriteFromNoun(objects.self()).setBounceOnWall(true)
            objects.setInstanceProperty(objects.self(), "size", objects.getLocal("size"))
            objects.setInstanceProperty(objects.self(), "maxHealth", randint(0, 20) + 50 * (objects.getLocal("size") / 100))
            objects.setInstanceProperty(objects.self(), "health", objects.getInstanceProperty(objects.self(), "maxHealth"))
            objects.getSpriteFromNoun(objects.self()).setScale(Math.map(objects.getLocal("size"), 0, 100, 0.5, 1.5), ScaleAnchor.Middle)
            objects.getSpriteFromNoun(objects.self()).x = objects.getLocal("x")
            objects.getSpriteFromNoun(objects.self()).y = objects.getLocal("y")
            objects.getSpriteFromNoun(objects.self()).vx = objects.getLocal("vx")
            objects.getSpriteFromNoun(objects.self()).vy = objects.getLocal("vy")
            objects.answer(objects.self())
        })
        objects.defineAritousVerb("struckBy", "projectile", function () {
            objects.setInstanceProperty(objects.self(), "health", objects.getInstanceProperty(objects.self(), "health") - objects.getInstanceProperty(objects.getLocal("projectile"), "damage"))
            if (objects.getInstanceProperty(objects.self(), "health") / objects.getInstanceProperty(objects.self(), "maxHealth") <= 0.5) {
                music.play(music.createSoundEffect(WaveShape.Noise, 496, 1, 255, 0, 1000, SoundExpressionEffect.None, InterpolationCurve.Logarithmic), music.PlaybackMode.InBackground)
                for (let index2 = 0; index2 <= 14; index2++) {
                    objects.setLocal("halfWidth", objects.getSpriteFromNoun(objects.self()).width / 2)
                    objects.setLocal("halfHeight", objects.getSpriteFromNoun(objects.self()).height / 2)
                    objects.setLocal("particleX", randint(objects.getLocal("halfHeight") * -1, objects.getLocal("halfHeight")) + objects.getSpriteFromNoun(objects.self()).x)
                    objects.setLocal("particleY", randint(objects.getLocal("halfWidth") * -1, objects.getLocal("halfWidth")) + objects.getSpriteFromNoun(objects.self()).y)
                    objects.tell(objects.newInstance("Particle"), "spawn", 1, objects.getLocal("particleX"), objects.getLocal("particleY"), randint(-20, 20), randint(-20, 20), randint(300, 600))
                }
                if (objects.getInstanceProperty(objects.self(), "size") >= 20) {
                    objects.tell(objects.newInstance("Astroid"), "spawn", objects.getSpriteFromNoun(objects.self()).x, objects.getSpriteFromNoun(objects.self()).y, randint(-20, 20), randint(-20, 20), objects.getInstanceProperty(objects.self(), "size") / 2)
                    objects.tell(objects.newInstance("Astroid"), "spawn", objects.getSpriteFromNoun(objects.self()).x, objects.getSpriteFromNoun(objects.self()).y, randint(-20, 20), randint(-20, 20), objects.getInstanceProperty(objects.self(), "size") / 2)
                }
                sprites.destroy(objects.getSpriteFromNoun(objects.self()))
                info.setScore(info.score() + 1)
            } else {
                music.play(music.createSoundEffect(WaveShape.Noise, 4886, 4184, 255, 0, 100, SoundExpressionEffect.Warble, InterpolationCurve.Logarithmic), music.PlaybackMode.InBackground)
                objects.getSpriteFromNoun(objects.self()).scale += -0.05
            }
        })
    })
}
music.stopAllSounds()
music.play(music.createSong(assets.song`theme`), music.PlaybackMode.LoopingInBackground)
defineEngine()
defineShip()
defineWeapons()
defineMisc()
defineEnemies()
defineWeaponsControl()
defineFlightControl()
defineHull()
definePilot()
let myNoun = objects.newNewInstance("Ship")
