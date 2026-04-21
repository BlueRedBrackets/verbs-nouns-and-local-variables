namespace SpriteKind {
    export const Particle = SpriteKind.create()
    export const StruckProjectile = SpriteKind.create()
    export const StruckEnemy = SpriteKind.create()
    export const AvionicsDisplay = SpriteKind.create()
    export const Debris = SpriteKind.create()
    export const Satellite = SpriteKind.create()
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
function defineModules () {
    objects.defineNoun("RetrogradeModule", function () {
        objects.defineNew("ship", function () {
            objects.setInstanceProperty(objects.self(), "cooldownTicks", 1)
            objects.setInstanceProperty(objects.self(), "flightControl", objects.getInstanceProperty(objects.getLocal("ship"), "flightControl"))
        })
        objects.defineNullaryVerb("activate", function () {
            objects.setLocal("vx", objects.getSpriteFromNoun(objects.getInstanceProperty(objects.self(), "ship")).vx * -1)
            objects.setLocal("vy", objects.getSpriteFromNoun(objects.getInstanceProperty(objects.self(), "ship")).vy)
            objects.tell(objects.getInstanceProperty(objects.self(), "flightControl"), "flyToward", objects.getLocal("vx"), objects.getLocal("vy"))
        })
    })
}
function rotatedRadians (radians: number, rotateByRadians: number) {
    return Math.abs(radians + rotateByRadians) % (2 * Math.PI)
}
function defineWeapons () {
    objects.defineNoun("Pellet", function () {
        objects.defineNew("", function () {
            objects.setInstanceProperty(objects.self(), "damage", 10)
            objects.setInstanceProperty(objects.self(), "speed", 100)
            objects.setInstanceProperty(objects.self(), "ticksToLoad", 35)
        })
        objects.defineAritousVerb("fire", "x, y, radians", function () {
            music.play(music.createSoundEffect(WaveShape.Noise, 2252, 627, 255, 0, 50, SoundExpressionEffect.Warble, InterpolationCurve.Logarithmic), music.PlaybackMode.InBackground)
            objects.setInstanceSprite(sprites.create(assets.image`pixel`, SpriteKind.Projectile), objects.self())
            objects.getSpriteFromNoun(objects.self()).lifespan = 5000
            objects.getSpriteFromNoun(objects.self()).x = objects.getLocal("x")
            objects.getSpriteFromNoun(objects.self()).y = objects.getLocal("y")
            toUnitVector(objects.getLocal("radians"))
            objects.getSpriteFromNoun(objects.self()).vx = objects.getLocal("__resultX") * objects.getInstanceProperty(objects.self(), "speed")
            objects.getSpriteFromNoun(objects.self()).vy = objects.getLocal("__resultY") * objects.getInstanceProperty(objects.self(), "speed")
            objects.getSpriteFromNoun(objects.self()).image.fill(1)
        })
    })
}
function toUnitVector (directionRadians: number) {
    objects.setLocal("__resultX", Math.cos(directionRadians))
    objects.setLocal("__resultY", Math.sin(directionRadians))
}
function defineText () {
    objects.defineNoun("AvionicsDisplay", function () {
        objects.defineNew("", function () {
            objects.setInstanceProperty(objects.self(), "hullIndicator", objects.newNewInstance("BarIndicator", 0, 0, 64, 4, true))
            objects.setInstanceProperty(objects.self(), "fuelIndicator", objects.newNewInstance("BarIndicator", scene.screenWidth() - 64, 0, 64, 4, false))
            objects.setInstanceProperty(objects.self(), "weaponsIndicator", objects.newNewInstance("BarIndicator", 0, scene.screenHeight() - 4, 64, 4, true))
            objects.setInstanceProperty(objects.self(), "specialIndicator", objects.newNewInstance("BarIndicator", scene.screenWidth() - 64, scene.screenHeight() - 4, 64, 4, false))
        })
        objects.defineAritousVerb("updateFuel", "current, max", function () {
            objects.tell(objects.getInstanceProperty(objects.self(), "fuelIndicator"), "updatePercentage", objects.getLocal("current"), objects.getLocal("max"))
        })
        objects.defineAritousVerb("updateHull", "current, max", function () {
            objects.tell(objects.getInstanceProperty(objects.self(), "hullIndicator"), "updatePercentage", objects.getLocal("current"), objects.getLocal("max"))
        })
        objects.defineAritousVerb("updateWeapons", "current, max", function () {
            objects.tell(objects.getInstanceProperty(objects.self(), "weaponsIndicator"), "updatePercentage", objects.getLocal("current"), objects.getLocal("max"))
        })
        objects.defineAritousVerb("updateSpecial", "current, max", function () {
            objects.tell(objects.getInstanceProperty(objects.self(), "specialIndicator"), "updatePercentage", objects.getLocal("current"), objects.getLocal("max"))
        })
    })
}
function definePilot () {
    objects.defineNoun("Pilot", function () {
        objects.defineNew("flightControl, weaponsControl, specialControl", function () {
        	
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
            if (controller.B.isPressed()) {
                objects.tell(objects.getInstanceProperty(objects.self(), "specialControl"), "activate")
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
        objects.defineNew("ship", function () {
            objects.setInstanceProperty(objects.self(), "maxStrength", 100)
            objects.setInstanceProperty(objects.self(), "strength", objects.getInstanceProperty(objects.self(), "maxStrength"))
            objects.setInstanceProperty(objects.self(), "avionicsDisplay", objects.getInstanceProperty(objects.getLocal("ship"), "avionicsDisplay"))
            objects.tell(objects.getInstanceProperty(objects.self(), "avionicsDisplay"), "updateHull", objects.getInstanceProperty(objects.self(), "strength"), objects.getInstanceProperty(objects.self(), "maxStrength"))
        })
        objects.defineAritousVerb("damage", "amount", function () {
            objects.setInstanceProperty(objects.self(), "strength", objects.getInstanceProperty(objects.self(), "strength") - objects.getLocal("amount"))
            objects.tell(objects.getInstanceProperty(objects.self(), "avionicsDisplay"), "updateHull", objects.getInstanceProperty(objects.self(), "strength"), objects.getInstanceProperty(objects.self(), "maxStrength"))
            if (objects.getInstanceProperty(objects.self(), "strength") <= 0) {
                music.stopAllSounds()
                objects.tell(objects.getInstanceProperty(objects.self(), "ship"), "hullBroken")
                music.rest(music.beat(BeatFraction.Double))
                game.reset()
            }
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
        objects.defineNew("ship, engine", function () {
            objects.setInstanceProperty(objects.self(), "attitude", objects.getSpriteFromNoun(objects.getLocal("ship")).rotation)
            objects.setState(objects.self(), "enabled")
        })
        objects.defineNullaryVerb("standby", function () {
            objects.tell(objects.getInstanceProperty(objects.self(), "engine"), "stop")
        })
        objects.defineAritousVerb("flyToward", "dx, dy", function () {
            if (objects.isInState(objects.self(), "enabled")) {
                if (objects.ask(objects.getInstanceProperty(objects.self(), "engine"), "haveFuel?")) {
                    objects.setLocal("targetAttitude", toRadians(objects.getLocal("dx"), objects.getLocal("dy")))
                    objects.setInstanceProperty(objects.self(), "attitude", objects.lerpRadians(objects.getInstanceProperty(objects.self(), "attitude"), objects.getLocal("targetAttitude"), 0.1))
                    objects.tell(objects.getInstanceProperty(objects.self(), "ship"), "reorient", objects.getInstanceProperty(objects.self(), "attitude"))
                    if (differenceInRadians(objects.getInstanceProperty(objects.self(), "attitude"), objects.getLocal("targetAttitude")) <= Math.PI / 16) {
                        objects.tell(objects.getInstanceProperty(objects.self(), "engine"), "start")
                    }
                }
            }
        })
        objects.onEnterState("disabled", function () {
            objects.tell(objects.getInstanceProperty(objects.self(), "engine"), "stop")
        })
    })
}
function defineEngine () {
    objects.defineNoun("PerpetualMotionEngine", function () {
        objects.defineNew("power, ship", function () {
        	
        })
        objects.onTickInState(objects.everyFrame(), "running", function () {
            objects.tell(objects.getInstanceProperty(objects.self(), "ship"), "thrust", objects.getInstanceProperty(objects.self(), "power"))
        })
        objects.defineNullaryVerb("start", function () {
            objects.setState(objects.self(), "running")
        })
        objects.defineNullaryVerb("stop", function () {
            objects.setState(objects.self(), "idle")
        })
        objects.defineNullaryVerb("haveFuel?", function () {
            objects.answer(true)
        })
    })
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
function defineAvionicsDisplay () {
    objects.defineNoun("AvionicsDisplay", function () {
        objects.defineNew("", function () {
            objects.setInstanceProperty(objects.self(), "hullIndicator", objects.newNewInstance("BarIndicator", 0, 0, 64, 4, true))
            objects.setInstanceProperty(objects.self(), "fuelIndicator", objects.newNewInstance("BarIndicator", scene.screenWidth() - 64, 0, 64, 4, false))
            objects.setInstanceProperty(objects.self(), "weaponsIndicator", objects.newNewInstance("BarIndicator", 0, scene.screenHeight() - 4, 64, 4, true))
            objects.setInstanceProperty(objects.self(), "specialIndicator", objects.newNewInstance("BarIndicator", scene.screenWidth() - 64, scene.screenHeight() - 4, 64, 4, false))
        })
        objects.defineAritousVerb("updateFuel", "current, max", function () {
            objects.tell(objects.getInstanceProperty(objects.self(), "fuelIndicator"), "updatePercentage", objects.getLocal("current"), objects.getLocal("max"))
        })
        objects.defineAritousVerb("updateHull", "current, max", function () {
            objects.tell(objects.getInstanceProperty(objects.self(), "hullIndicator"), "updatePercentage", objects.getLocal("current"), objects.getLocal("max"))
        })
        objects.defineAritousVerb("updateWeapons", "current, max", function () {
            objects.tell(objects.getInstanceProperty(objects.self(), "weaponsIndicator"), "updatePercentage", objects.getLocal("current"), objects.getLocal("max"))
        })
        objects.defineAritousVerb("updateSpecial", "current, max", function () {
            objects.tell(objects.getInstanceProperty(objects.self(), "specialIndicator"), "updatePercentage", objects.getLocal("current"), objects.getLocal("max"))
        })
    })
}
function distance (a: Sprite, b: Sprite) {
    return hypotenuse(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
}
function defineSpecialControl () {
    objects.defineNoun("SpecialControl", function () {
        objects.defineNew("ship", function () {
            objects.setInstanceProperty(objects.self(), "avionicsDisplay", objects.getInstanceProperty(objects.getLocal("ship"), "avionicsDisplay"))
            objects.setInstanceProperty(objects.self(), "ticksUntilReady", 0)
            objects.setInstanceProperty(objects.self(), "cooldownTicks", 0)
            objects.setInstanceProperty(objects.self(), "installed", 0)
            objects.setState(objects.self(), "empty")
            objects.tell(objects.self(), "install", objects.newNewInstance("RetrogradeModule", objects.getLocal("ship")))
        })
        objects.onTickInState(objects.everyFrame(), "cooldown", function () {
            objects.setInstanceProperty(objects.self(), "cooldownTicks", objects.getInstanceProperty(objects.self(), "cooldownTicks") + 1)
            if (objects.getInstanceProperty(objects.self(), "cooldownTicks") >= objects.getInstanceProperty(objects.self(), "ticksUntilReady")) {
                objects.setState(objects.self(), "ready")
            }
            objects.tell(objects.getInstanceProperty(objects.self(), "avionicsDisplay"), "updateSpecial", objects.getInstanceProperty(objects.self(), "cooldownTicks"), objects.getInstanceProperty(objects.self(), "ticksUntilReady"))
        })
        objects.defineAritousVerb("install", "module", function () {
            objects.setInstanceProperty(objects.self(), "installed", objects.getLocal("module"))
            objects.setInstanceProperty(objects.self(), "ticksUntilReady", objects.getInstanceProperty(objects.getInstanceProperty(objects.self(), "installed"), "cooldownTicks"))
            objects.setState(objects.self(), "cooldown")
        })
        objects.onEnterState("cooldown", function () {
            objects.setInstanceProperty(objects.self(), "cooldownTicks", 0)
        })
        objects.defineNullaryVerb("activate", function () {
            if (objects.isInState(objects.self(), "ready")) {
                objects.tell(objects.getInstanceProperty(objects.self(), "installed"), "activate")
                objects.setState(objects.self(), "cooldown")
            }
        })
    })
}
function defineChamber () {
    objects.defineNoun("Chamber", function () {
        objects.defineNew("ship", function () {
            objects.setInstanceProperty(objects.self(), "ammunition", 0)
            objects.setInstanceProperty(objects.self(), "chambered", 0)
            objects.setInstanceProperty(objects.self(), "ticksToLoad", 0)
            objects.setInstanceProperty(objects.self(), "ticksLoaded", 0)
            objects.setState(objects.self(), "empty")
        })
        objects.defineAritousVerb("load", "ammunition", function () {
            objects.setInstanceProperty(objects.self(), "ammunition", objects.getLocal("ammunition"))
            objects.setInstanceProperty(objects.self(), "chambered", objects.newNewInstance(objects.getInstanceProperty(objects.self(), "ammunition")))
            objects.setInstanceProperty(objects.self(), "ticksToLoad", objects.getInstanceProperty(objects.getInstanceProperty(objects.self(), "chambered"), "ticksToLoad"))
            objects.setInstanceProperty(objects.self(), "ticksLoaded", 0)
            objects.setState(objects.self(), "loading")
        })
        objects.defineNullaryVerb("fire", function () {
            if (objects.isInState(objects.self(), "loaded")) {
                objects.tell(objects.getInstanceProperty(objects.self(), "ship"), "fire", objects.getInstanceProperty(objects.self(), "chambered"))
                objects.tell(objects.self(), "load", objects.getInstanceProperty(objects.self(), "ammunition"))
            }
        })
        objects.onTickInState(objects.everyFrame(), "loading", function () {
            if (objects.getInstanceProperty(objects.self(), "ticksLoaded") >= objects.getInstanceProperty(objects.self(), "ticksToLoad")) {
                objects.setState(objects.self(), "loaded")
            } else {
                objects.setInstanceProperty(objects.self(), "ticksLoaded", objects.getInstanceProperty(objects.self(), "ticksLoaded") + 1)
            }
            objects.tell(objects.getInstanceProperty(objects.getInstanceProperty(objects.self(), "ship"), "avionicsDisplay"), "updateWeapons", objects.getInstanceProperty(objects.self(), "ticksLoaded"), objects.getInstanceProperty(objects.self(), "ticksToLoad"))
        })
    })
}
function defineWeaponsControl () {
    objects.defineNoun("WeaponsControl", function () {
        objects.defineNew("ship", function () {
            objects.setInstanceProperty(objects.self(), "chamber", objects.newNewInstance("Chamber", objects.getLocal("ship")))
            objects.tell(objects.getInstanceProperty(objects.self(), "chamber"), "load", "Pellet")
            objects.setState(objects.self(), "enabled")
        })
        objects.defineNullaryVerb("fire", function () {
            if (objects.isInState(objects.self(), "enabled")) {
                objects.tell(objects.getInstanceProperty(objects.self(), "chamber"), "fire")
            }
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
            objects.setInstanceProperty(objects.self(), "flightControl", objects.newNewInstance("FlightControl", objects.self(), objects.newNewInstance("Engine", 2, 300, objects.self())))
            objects.setInstanceProperty(objects.self(), "weaponsControl", objects.newNewInstance("WeaponsControl", objects.self()))
            objects.setInstanceProperty(objects.self(), "specialControl", objects.newNewInstance("SpecialControl", objects.self()))
            objects.setInstanceProperty(objects.self(), "pilot", objects.newNewInstance("Pilot", objects.getInstanceProperty(objects.self(), "flightControl"), objects.getInstanceProperty(objects.self(), "weaponsControl"), objects.getInstanceProperty(objects.self(), "specialControl")))
            objects.setInstanceProperty(objects.self(), "hull", objects.newNewInstance("Hull", objects.self()))
        })
        objects.defineAritousVerb("reorient", "radians", function () {
            objects.getSpriteFromNoun(objects.self()).rotation = objects.getLocal("radians")
        })
        objects.defineAritousVerb("thrust", "power", function () {
            toUnitVector(objects.getSpriteFromNoun(objects.self()).rotation)
            objects.getSpriteFromNoun(objects.self()).vx += objects.getLocal("__resultX") * objects.getLocal("power")
            objects.getSpriteFromNoun(objects.self()).vy += objects.getLocal("__resultY") * objects.getLocal("power")
            objects.setLocal("particleSpeed", objects.getLocal("power") * 50)
            for (let index = 0; index < 5; index++) {
                rotatedVector(-8, randint(-2, 2), objects.getSpriteFromNoun(objects.self()).rotation)
                objects.setLocal("xSpawn", objects.getSpriteFromNoun(objects.self()).x + objects.getLocal("__resultX"))
                objects.setLocal("ySpawn", objects.getSpriteFromNoun(objects.self()).y + objects.getLocal("__resultY"))
                toUnitVector(objects.getSpriteFromNoun(objects.self()).rotation)
                objects.setLocal("xVelocity", objects.getLocal("__resultX") * objects.getLocal("particleSpeed") * (randint(8, 11) / -10))
                objects.setLocal("yVelocity", objects.getLocal("__resultY") * objects.getLocal("particleSpeed") * (randint(8, 11) / -10))
                objects.spawn("Particle", 1, objects.getLocal("xSpawn"), objects.getLocal("ySpawn"), objects.getLocal("xVelocity"), objects.getLocal("yVelocity"), randint(100, 300))
            }
        })
        objects.defineAritousVerb("hullBroken", "", function () {
            objects.getSpriteFromNoun(objects.self()).sayText("ouch", 2000, true)
            objects.getSpriteFromNoun(objects.self()).image.fill(0)
            objects.setState(objects.getInstanceProperty(objects.self(), "flightControl"), "disabled")
            objects.setState(objects.getInstanceProperty(objects.self(), "weaponsControl"), "disabled")
            objects.setState(objects.getInstanceProperty(objects.self(), "specialControl"), "disabled")
            for (let index = 0; index < 16; index++) {
                objects.setLocal("halfWidth", objects.getSpriteFromNoun(objects.self()).width / 2)
                objects.setLocal("halfHeight", objects.getSpriteFromNoun(objects.self()).height / 2)
                objects.setLocal("particleX", randint(objects.getLocal("halfHeight") * -1, objects.getLocal("halfHeight")) + objects.getSpriteFromNoun(objects.self()).x)
                objects.setLocal("particleY", randint(objects.getLocal("halfWidth") * -1, objects.getLocal("halfWidth")) + objects.getSpriteFromNoun(objects.self()).y)
                objects.setLocal("particleVx", (objects.getSpriteFromNoun(objects.self()).vx + randint(-20, 20)) / 2)
                objects.setLocal("particleVy", (objects.getSpriteFromNoun(objects.self()).vy + randint(-20, 20)) / 2)
                objects.spawn("Particle", 1, objects.getLocal("particleX"), objects.getLocal("particleY"), objects.getLocal("particleVx"), objects.getLocal("particleVy"), randint(300, 600))
            }
            objects.getSpriteFromNoun(objects.self()).setVelocity(0, 0)
        })
        objects.defineAritousVerb("struck", "damage", function () {
            objects.tell(objects.getInstanceProperty(objects.self(), "hull"), "damage", objects.getLocal("damage"))
        })
        objects.defineAritousVerb("fire", "ammunition", function () {
            rotatedVector(8, 0, objects.getSpriteFromNoun(objects.self()).rotation)
            objects.setLocal("xSpawn", objects.getSpriteFromNoun(objects.self()).x + objects.getLocal("__resultX"))
            objects.setLocal("ySpawn", objects.getSpriteFromNoun(objects.self()).y + objects.getLocal("__resultY"))
            objects.tell(objects.getLocal("ammunition"), "fire", objects.getLocal("xSpawn"), objects.getLocal("ySpawn"), objects.getSpriteFromNoun(objects.self()).rotation)
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
        objects.defineNew("color, x, y, vx, vy, lifespan", function () {
            objects.setInstanceSprite(sprites.create(assets.image`pixel`, SpriteKind.Particle), objects.self())
            objects.getSpriteFromNoun(objects.self()).image.fill(objects.getLocal("color"))
            objects.getSpriteFromNoun(objects.self()).x = objects.getLocal("x")
            objects.getSpriteFromNoun(objects.self()).y = objects.getLocal("y")
            objects.getSpriteFromNoun(objects.self()).vx = objects.getLocal("vx")
            objects.getSpriteFromNoun(objects.self()).vy = objects.getLocal("vy")
            objects.getSpriteFromNoun(objects.self()).lifespan = objects.getLocal("lifespan")
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
    objects.tell(objects.getNounFromSprite(otherSprite), "rammed", objects.getNounFromSprite(sprite))
    objects.tell(objects.getNounFromSprite(sprite), "struck", objects.getInstanceProperty(objects.getNounFromSprite(otherSprite), "damage"))
})
function defineEnemies () {
    objects.defineNoun("Astroid", function () {
        objects.defineNew("x, y, vx, vy, size", function () {
            objects.setLocal("astroidImages", [assets.image`astroid-a`, assets.image`astroid-b`, assets.image`astroid-c`])
            objects.setInstanceSprite(sprites.create(objects.asArray(objects.getLocal("astroidImages"))._pickRandom(), SpriteKind.Enemy), objects.self())
            objects.getSpriteFromNoun(objects.self()).setStayInScreen(true)
            objects.getSpriteFromNoun(objects.self()).setBounceOnWall(true)
            objects.setInstanceProperty(objects.self(), "maxHealth", randint(0, 20) + 50 * (objects.getLocal("size") / 100))
            objects.setInstanceProperty(objects.self(), "health", objects.getInstanceProperty(objects.self(), "maxHealth"))
            objects.setInstanceProperty(objects.self(), "damage", objects.getLocal("size") * 2)
            objects.setInstanceProperty(objects.self(), "spin", randint(-10, 10))
            objects.getSpriteFromNoun(objects.self()).setScale(Math.map(objects.getLocal("size"), 0, 100, 0.5, 1.5), ScaleAnchor.Middle)
            objects.getSpriteFromNoun(objects.self()).x = objects.getLocal("x")
            objects.getSpriteFromNoun(objects.self()).y = objects.getLocal("y")
            objects.getSpriteFromNoun(objects.self()).vx = objects.getLocal("vx")
            objects.getSpriteFromNoun(objects.self()).vy = objects.getLocal("vy")
        })
        objects.onTick(objects.everyFrame(), function () {
            objects.getSpriteFromNoun(objects.self()).rotation += Math.map(objects.getInstanceProperty(objects.self(), "spin"), -10, 10, Math.PI / -32, Math.PI / 32)
        })
        objects.defineAritousVerb("struckBy", "projectile", function () {
            objects.setInstanceProperty(objects.self(), "health", objects.getInstanceProperty(objects.self(), "health") - objects.getInstanceProperty(objects.getLocal("projectile"), "damage"))
            if (objects.getInstanceProperty(objects.self(), "health") / objects.getInstanceProperty(objects.self(), "maxHealth") <= 0.5) {
                objects.tell(objects.self(), "expload")
                if (objects.getInstanceProperty(objects.self(), "size") >= 20) {
                    objects.spawn("Astroid", objects.getSpriteFromNoun(objects.self()).x, objects.getSpriteFromNoun(objects.self()).y, randint(-20, 20), randint(-20, 20), objects.getInstanceProperty(objects.self(), "size") / 2)
                    objects.spawn("Astroid", objects.getSpriteFromNoun(objects.self()).x, objects.getSpriteFromNoun(objects.self()).y, randint(-20, 20), randint(-20, 20), objects.getInstanceProperty(objects.self(), "size") / 2)
                }
                sprites.destroy(objects.getSpriteFromNoun(objects.self()))
                info.changeScoreBy(1)
            } else {
                music.play(music.createSoundEffect(WaveShape.Noise, 4886, 4184, 255, 0, 100, SoundExpressionEffect.Warble, InterpolationCurve.Logarithmic), music.PlaybackMode.InBackground)
                objects.getSpriteFromNoun(objects.self()).scale += -0.05
            }
        })
        objects.defineNullaryVerb("expload", function () {
            music.play(music.createSoundEffect(WaveShape.Noise, 496, 1, 255, 0, 1000, SoundExpressionEffect.None, InterpolationCurve.Logarithmic), music.PlaybackMode.InBackground)
            for (let index = 0; index < 16; index++) {
                objects.setLocal("halfWidth", objects.getSpriteFromNoun(objects.self()).width / 2)
                objects.setLocal("halfHeight", objects.getSpriteFromNoun(objects.self()).height / 2)
                objects.setLocal("particleX", randint(objects.getLocal("halfHeight") * -1, objects.getLocal("halfHeight")) + objects.getSpriteFromNoun(objects.self()).x)
                objects.setLocal("particleY", randint(objects.getLocal("halfWidth") * -1, objects.getLocal("halfWidth")) + objects.getSpriteFromNoun(objects.self()).y)
                objects.spawn("Particle", 1, objects.getLocal("particleX"), objects.getLocal("particleY"), randint(-20, 20), randint(-20, 20), randint(300, 600))
            }
        })
        objects.defineAritousVerb("rammed", "ship", function () {
            objects.tell(objects.self(), "expload")
            scene.cameraShake(objects.getInstanceProperty(objects.self(), "size") / 20, objects.getInstanceProperty(objects.self(), "size") * 10)
            sprites.destroy(objects.getSpriteFromNoun(objects.self()))
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
defineAvionicsDisplay()
defineChamber()
defineSpecialControl()
defineModules()
let myNoun = objects.newNewInstance("Ship")
for (let index = 0; index < 3; index++) {
    objects.defineLocalFrame(function () {
        objects.setLocal("x", randint(0, scene.screenWidth()))
        objects.setLocal("y", randint(0, scene.screenHeight()))
        objects.setLocal("vx", randint(-20, 20))
        objects.setLocal("vy", randint(-20, 20))
        objects.setLocal("size", randint(75, 100))
        objects.spawn("Astroid", objects.getLocal("x"), objects.getLocal("y"), objects.getLocal("vx"), objects.getLocal("vy"), objects.getLocal("size"))
    })
}
objects.getSpriteFromNoun(myNoun).sayText("hello", 2000, true)
music.rest(music.beat(BeatFraction.Breve))
objects.getSpriteFromNoun(myNoun).sayText("world", 2000, true)
game.onUpdateInterval(5000, function () {
    if (objects.getAllInstancesOf("Astroid").length <= 0) {
        music.stopAllSounds()
        game.setGameOverPlayable(true, music.createSong(assets.song`victory`), true)
        game.setGameOverEffect(true, effects.starField)
        game.gameOver(true)
    }
})
