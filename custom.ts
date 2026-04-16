/**
 * Object Blocks
 */
//% weight=100 color=#0fbc11 icon="\uf1b2"
//% groups='["Definitions", "Instances", "Getters", "Setters", "Utility"]'
namespace objects {

    export class LocalFrame {
        self: NounInstance;
        locals: { [key: string]: any };
        returnValue: any;

        constructor(self: NounInstance, locals: { [key: string]: any }) {
            this.self = self;
            this.locals = locals;
            this.returnValue = undefined;
        }

        setLocal(key: string, value: any) {
            this.locals[key] = value;
        }

        getLocal(key: string, value: any) {
            this.locals[key];
        }
    }

    export class NounInstance {
        name: string;
        _verbs: { [key: string]: VerbDefinition };
        _data: any;
        _sprite: Sprite;

        constructor(name: string, verbs: { [key: string]: VerbDefinition }) {
            this.name = name;
            this._verbs = verbs;
            this._data = {};
            this._sprite = null;
        }
    }

    export class VerbDefinition {
        action: (self: NounInstance) => void;
        names: string[];

        constructor(action: (self: NounInstance) => void, names: string[]) {
            this.action = action;
            this.names = names;
        }
    }

    export class NounDefinition {
        name: string;
        _verbs: { [key: string]: VerbDefinition };
        _intervals: number[];

        constructor(name: string) {
            this.name = name;
            this._verbs = {};
            this._intervals = [];
        }
    }

    // ==========================================
    // CORE
    // ==========================================

    const nounRegistry: { [key: string]: NounDefinition } = {};
    const allInstances: NounInstance[] = [];
    const _nounDefinitionStack: NounDefinition[] = [];
    const LOCAL_FRAME_STACK: LocalFrame[] = [];

    function peek(stack: any[]): any {
        if (stack.length > 0) {
            return stack[stack.length - 1];
        }
        return undefined;
    }

    function _executeVerb(instance: NounInstance, verbName: string, passedArgs: any[]): any {
        // make function call frame
        if (!instance || !instance._verbs || !instance._verbs[verbName]) return undefined;
        let verbDef = instance._verbs[verbName];
        let locals: { [key: string]: any } = {};
        for (let i = 0; i < verbDef.names.length; i++) {
            if (passedArgs[i] !== undefined) {
                locals[verbDef.names[i]] = passedArgs[i];
            }
        }
        let frame = new LocalFrame(instance, locals);
        LOCAL_FRAME_STACK.push(frame);

        // execute
        verbDef.action(instance);

        // grab result and pop the frame
        let result = frame.returnValue;
        LOCAL_FRAME_STACK.pop();
        return result;
    }

    // ==========================================
    // DEFINITIONS
    // ==========================================

    /**
     * Defines a noun.
     */
    //% blockId="define_noun"
    //% group="Definitions"
    //% block="define noun $name"
    //% name.shadow="objects_noun_picker"
    //% handlerStatement=1
    export function defineNoun(name: string, userDefinition: () => void): void {
        let nounDef = new NounDefinition(name);
        _nounDefinitionStack.push(nounDef);
        userDefinition();
        nounRegistry[name] = nounDef;
        _nounDefinitionStack.pop();
    }

    /**
     * Defines a verb with arguments.
     */
    //% blockId="define_aritous_verb"
    //% group="Definitions"
    //% block="define verb $verbName given $argNames"
    //% verbName.shadow="objects_verb_picker"
    //% argNames.shadow="text"
    //% argNames.defl="foo, bar"
    //% handlerStatement=1
    export function defineAritousVerb(verbName: string, argNames: string, definition: () => void): void {
        let currentNoun = peek(_nounDefinitionStack) as NounDefinition;
        if (currentNoun) {
            let parsedNames = argNames.split(",")
                .map(s => s.trim())
                .filter(s => s.length > 0);
            currentNoun._verbs[verbName] = new VerbDefinition(definition, parsedNames);
        }
    }

    /**
    * Defines a simple verb.
    */
    //% blockId="define_nullary_verb"
    //% group="Definitions"
    //% block="define verb $verbName"
    //% verbName.shadow="objects_verb_picker"
    //% handlerStatement=1
    export function defineNullaryVerb(verbName: string, definition: () => void): void {
        let currentNoun = peek(_nounDefinitionStack) as NounDefinition;
        if (currentNoun) {
            currentNoun._verbs[verbName] = new VerbDefinition(definition, []);
        }
    }

    /**
    * Defines a simple verb.
    */
    //% blockId="define_local_frame"
    //% group="Definitions"
    //% block="context"
    //% handlerStatement=1
    export function defineLocalFrame(definition: () => void): void {
        // make function call frame
        let frameBelow = peek(LOCAL_FRAME_STACK) as LocalFrame
        if (frameBelow) {
            LOCAL_FRAME_STACK.push(new LocalFrame(frameBelow.self, frameBelow.locals));
        } else {
            LOCAL_FRAME_STACK.push(new LocalFrame(null, {}));
        }
        definition()
        LOCAL_FRAME_STACK.pop();
    }

    /**
    * Provide an answer from the current verb.
    */
    //% blockId="answer"
    //% group="Definitions"
    //% block="answer with $value"
    export function answer(value: any): void {
        let frame = peek(LOCAL_FRAME_STACK) as LocalFrame;
        if (frame) {
            frame.returnValue = value;
        }
    }

    /**
    * A reference to yourself.
    */
    //% blockId="self_block"
    //% group="Definitions"
    //% block="self"
    export function self(): any {
        let frame = peek(LOCAL_FRAME_STACK) as LocalFrame;
        return frame ? frame.self : null;
    }

    /**
    * Runs logic at an interval (or every frame) and optionally only in a state.
    */
    //% blockId="on_noun_tick"
    //% group="States"
    //% block="on every $interval"
    //% interval.shadow="every_frame_tick"
    //% state.shadow="objects_state_picker"
    //% handlerStatement=1
    //% weight=10
    export function onTick(interval: number, handler: () => void): void {
        let currentNoun = peek(_nounDefinitionStack) as NounDefinition;
        if (currentNoun) {
            // Key format: __tick_[ms]_[state] or __tick_[ms]
            let key = "__tick_" + interval;
            currentNoun._verbs[key] = new VerbDefinition(handler, []);

            // Track this interval on the noun so the ticker knows to check it
            if (currentNoun._intervals.indexOf(interval) === -1) {
                currentNoun._intervals.push(interval);
            }
        }
    }

    // ==========================================
    // INSTANCES
    // ==========================================

    /**
    * Creates a new instance of a noun.
    */
    //% blockId="new_instance"
    //% group="Instances"
    //% block="new $nounName"
    //% nounName.shadow="objects_noun_picker"
    //% blockSetVariable="myNoun"
    export function newInstance(nounName: string): any {
        if (nounRegistry[nounName]) {
            let nounDef = nounRegistry[nounName];
            let it = new NounInstance(nounDef.name, nounDef._verbs);
            allInstances.push(it);
            _executeVerb(it, "__onStart", []);
            return it;
        }
        return null;
    }
    /**
     * Gets an array of all instances of a specific noun.
     */
    //% blockId="get_all_instances_of"
    //% group="Instances"
    //% block="array of all $nounName"
    //% nounName.shadow="objects_noun_picker"
    export function getAllInstancesOf(nounName: string): any[] {
        let result: NounInstance[] = [];
        for (let inst of allInstances) {
            if (inst.name === nounName) {
                result.push(inst);
            }
        }
        return result;
    }

    /**
     * Tells an instance to do a verb.
     */
    //% blockId="tell"
    //% group="Instances"
    //% block="tell $instance $verbName|| using $arg0 $arg1 $arg2 $arg3 $arg4 $arg5 $arg6 $arg7 $arg8 $arg9"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    //% verbName.shadow="objects_verb_picker"
    //% inlineInputMode=inline
    export function tell(instance: any, verbName: string, arg0?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, arg6?: any, arg7?: any, arg8?: any, arg9?: any): void {
        let args = [arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9]
        _executeVerb(instance, verbName, args);
    }

    /**
    * Asks a noun for an answer.
    */
    //% blockId="ask"
    //% group="Instances"
    //% block="ask $instance $verbName|| using $arg0 $arg1 $arg2 $arg3 $arg4 $arg5 $arg6 $arg7 $arg8 $arg9"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    //% verbName.shadow="objects_verb_picker"
    //% inlineInputMode=inline
    export function ask(instance: any, verbName: string, arg0?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, arg6?: any, arg7?: any, arg8?: any, arg9?: any): any {
        let args = [arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9]
        return _executeVerb(instance, verbName, args);
    }

    // ==========================================
    // GETTERS
    // ==========================================

    /**
     * Get a property from a specific instance.
     */
    //% blockId="get_instance_property"
    //% group="Getters"
    //% block="$key of $instance"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    //% key.shadow="objects_property_picker"
    export function getInstanceProperty(instance: any, key: string): any {
        let target = instance as NounInstance;
        return target ? target._data[key] : null;
    }

    /**
    * Gets an argument or local variable from the current frame.
    */
    //% blockId="get_verb_local_variable"
    //% group="Getters"
    //% block="get $localName"
    export function getLocal(localName: string): any {
        let frame = peek(LOCAL_FRAME_STACK) as LocalFrame;
        if (frame && frame.locals[localName] !== undefined) {
            return frame.locals[localName];
        }
        return null;
    }

    /**
     * Gets the noun instance associated with a sprite.
     */
    //% blockId="get_noun_from_sprite"
    //% group="Getters"
    //% block="$sprite noun"
    //% sprite.shadow="variables_get"
    export function getNounFromSprite(sprite: Sprite): any {
        if (sprite && sprite.data["noun_instance"]) {
            return sprite.data["noun_instance"];
        }
        return null;
    }

    /**
     * Gets the sprite associated with a noun instance.
     */
    //% blockId="get_sprite_from_noun"
    //% group="Getters"
    //% block="$instance sprite"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    export function getSpriteFromNoun(instance: any): Sprite {
        let self = instance as NounInstance;
        if (self && self._sprite) {
            return self._sprite;
        }
        return null;
    }

    // ==========================================
    // SETTERS
    // ==========================================

    /**
     * Set a property on a specific instance.
     */
    //% blockId="set_instance_property"
    //% group="Setters"
    //% block="set $instance $key to $value"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    //% key.shadow="objects_property_picker"
    export function setInstanceProperty(instance: any, key: string, value: any): void {
        let target = instance as NounInstance;
        if (target) {
            target._data[key] = value;
        }
    }

    /**
    * Sets a variable local to the current verb frame.
    */
    //% blockId="set_verb_local_variable"
    //% group="Setters"
    //% block="set $localName to $value"
    export function setLocal(localName: string, value: any): void {
        let frame = peek(LOCAL_FRAME_STACK) as LocalFrame;
        if (frame) {
            frame.locals[localName] = value;
        }
    }

    /**
     * Links a noun to a sprite instance.
     */
    //% blockId="set_instance_sprite"
    //% group="Setters"
    //% block="set $instance sprite $sprite"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    //% sprite.shadow="variables_get"
    export function setInstanceSprite(sprite: Sprite, instance: any): void {
        let inst = instance as NounInstance;
        if (sprite && inst) {
            inst._sprite = sprite;
            sprite.data["noun_instance"] = inst;
            sprite.onDestroyed(() => {
                const index = allInstances.indexOf(inst);
                if (index > -1) {
                    allInstances.splice(index, 1);
                }
                inst._sprite = null;
            });
        }
    }

    /**
    * Links a sprite to a noun instance.
    */
    //% blockId="set_sprite_noun"
    //% group="Setters"
    //% block="set $sprite noun $instance"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    //% sprite.shadow="variables_get"
    export function setSpriteNoun(sprite: Sprite, instance: any): void {
        let inst = instance as NounInstance;
        if (sprite && inst) {
            sprite.data["noun_instance"] = inst;
        }
    }

    // ==========================================
    // STATES
    // ==========================================

    /**
     * Changes the state and triggers transition verbs: onExitOldState and onEnterNewState.
     */
    //% blockId="set_state"
    //% group="States"
    //% block="set $instance state to $newState"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    //% newState.shadow="objects_state_picker"
    export function setState(instance: any, newState: string): void {
        let inst = instance as NounInstance;
        if (!inst) return;
        let oldState = getState(inst);
        if (oldState === newState) return;
        if (oldState) {
            _executeVerb(inst, "__onExit" + oldState, []);
        }
        setInstanceProperty(inst, "__state", newState);
        _executeVerb(inst, "__onEnter" + newState, []);
    }

    /**
     * Gets the current state name of an instance.
     */
    //% blockId="get_state"
    //% group="States"
    //% block="$instance state"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    export function getState(instance: any): string {
        return getInstanceProperty(instance, "__state") || undefined;
    }
    /**
    * Logic that runs once when an instance enters a specific state.
    */
    //% blockId="on_enter_state_block"
    //% group="States"
    //% block="on enter $state"
    //% state.shadow="objects_state_picker"
    //% handlerStatement=1
    //% weight=8
    export function onEnterState(state: string, handler: () => void): void {
        let currentNoun = peek(_nounDefinitionStack) as NounDefinition;
        if (currentNoun && state) {
            currentNoun._verbs["__onEnter" + state] = new VerbDefinition(handler, []);
        }
    }

    /**
     * Logic that runs once when an instance leaves a specific state.
     */
    //% blockId="on_exit_state"
    //% group="States"
    //% block="on exit $state"
    //% state.shadow="objects_state_picker"
    //% handlerStatement=1
    //% weight=7
    export function onExitState(state: string, handler: () => void): void {
        let currentNoun = peek(_nounDefinitionStack) as NounDefinition;
        if (currentNoun && state) {
            currentNoun._verbs["__onExit" + state] = new VerbDefinition(handler, []);
        }
    }

    /**
    * Runs logic at an interval (or every frame) and optionally only in a state.
    */
    //% blockId="on_noun_tick_in_state"
    //% group="States"
    //% block="on every $interval when $state"
    //% interval.shadow="every_frame_tick"
    //% state.shadow="objects_state_picker"
    //% handlerStatement=1
    //% weight=10
    export function onTickInState(interval: number, state: string, handler: () => void): void {
        let currentNoun = peek(_nounDefinitionStack) as NounDefinition;
        if (currentNoun) {
            // Key format: __tick_[ms]_[state] or __tick_[ms]
            let key = "__tick_" + interval + (state ? "_" + state : "");
            currentNoun._verbs[key] = new VerbDefinition(handler, []);

            // Track this interval on the noun so the ticker knows to check it
            if (currentNoun._intervals.indexOf(interval) === -1) {
                currentNoun._intervals.push(interval);
            }
        }
    }

    /**
     * Checks if the instance is currently in a specific state.
     */
    //% blockId="is_in_state"
    //% group="States"
    //% block="is $instance $stateName"
    //% instance.shadow="self_block"
    //% instance.defl="self_block"
    //% stateName.shaow="objects_state_picker"
    export function isInState(instance: any, stateName: string): boolean {
        return getState(instance) === stateName;
    }

    // ==========================================
    // UTILITY
    // ==========================================

    //% blockId="lerp_block"
    //% group="Utility"
    //% block="lerp $start to $end by $amount"
    //% start.defl=0
    //% end.defl=100
    //% amount.defl=0.5
    export function lerp(start: number, end: number, amount: number): number {
        amount = Math.max(0, Math.min(1, amount));
        return start + (end - start) * amount;
    }

    //% blockId="lerp_radians_block"
    //% group="Utility"
    //% block="lerp radians $start to $end by $amount"
    //% amount.defl=0.5
    export function lerpRadians(start: number, end: number, amount: number): number {
        let diff = (end - start + Math.PI) % (2 * Math.PI);
        if (diff < 0) diff += 2 * Math.PI;
        let delta = diff - Math.PI;
        return start + delta * amount;
    }

    //% block="$val as array"
    //% group="Utility"
    export function asArray(val: any): any[] {
        return val as any[];
    }

    //% block="$val as number"
    //% group="Utility"
    export function asNumber(val: any): number {
        return val as number;
    }

    //% block="$val as image"
    //% group="Utility"
    export function asImage(val: any): Image {
        return val as Image;
    }

    //% block="$val as sprite"
    //% group="Utility"
    export function asSprite(val: any): Sprite {
        return val as Sprite;
    }

    /**
     * A value representing every frame (0 ms).
     */
    //% blockId="every_frame_tick"
    //% block="tick"
    //% group="Utility"
    export function everyFrame(): number {
        return 0;
    }

    // ==========================================
    // HIDDEN / AUTOCOMPLETE
    // ==========================================

    //% blockId=objects_noun_picker
    //% block="$key"
    //% shim=TD_ID
    //% key.fieldEditor="autocomplete"
    //% key.fieldOptions.decompileLiterals=true
    //% key.fieldOptions.key="objects_noun_picker"
    //% blockHidden=true
    export function _nounPicker(key: string): string {
        return key;
    }

    //% blockId=objects_verb_picker
    //% block="$key"
    //% shim=TD_ID
    //% key.fieldEditor="autocomplete"
    //% key.fieldOptions.decompileLiterals=true
    //% key.fieldOptions.key="objects_verb_picker"
    //% blockHidden=true
    export function _verbPicker(key: string): string {
        return key;
    }

    //% blockId=objects_property_picker
    //% block="$key"
    //% shim=TD_ID
    //% key.fieldEditor="autocomplete"
    //% key.fieldOptions.decompileLiterals=true
    //% key.fieldOptions.key="objects_property_picker"
    //% blockHidden=true
    export function _propertyPicker(key: string): string {
        return key;
    }

    //% blockId=objects_state_picker
    //% block="$key"
    //% shim=TD_ID
    //% key.fieldEditor="autocomplete"
    //% key.fieldOptions.decompileLiterals=true
    //% key.fieldOptions.key="objects_state_picker"
    //% blockHidden=true
    export function _statePicker(key: string): string {
        return key;
    }

    // ==========================================
    // AUTO-REGISTRATION / GLOBAL TICKER
    // ==========================================

    /**
     * Tick all active instances.
     */
    game.onUpdate(function () {
        let now = game.runtime();

        for (let i = 0; i < allInstances.length; i++) {
            let inst = allInstances[i];
            let nounDef = nounRegistry[inst.name];
            if (!nounDef) continue;
            let currentState = getState(inst);
            for (let ms of nounDef._intervals) {
                let lastRunKey = "__lastRun_" + ms;
                let lastRun = inst._data[lastRunKey] || 0;
                if (ms === 0 || (now - lastRun >= ms)) {
                    inst._data[lastRunKey] = now;
                    _executeVerb(inst, "__tick_" + ms, []);
                    if (currentState) {
                        _executeVerb(inst, "__tick_" + ms + "_" + currentState, []);
                    }
                }
            }
        }
    });
}