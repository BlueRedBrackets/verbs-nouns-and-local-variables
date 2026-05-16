/**
 * Object Blocks
 */
//% weight=100 color=#0fbc11 icon="\uf1b2"
//% groups='["Definitions", "Instances", "Getters", "Setters", "Controls", "Utility", "States"]'
namespace objects {

    export enum ObjectsButton {
        //% block="direction"
        Direction,
        //% block="up"
        Up,
        //% block="down"
        Down,
        //% block="left"
        Left,
        //% block="right"
        Right,
        //% block="A"
        A,
        //% block="B"
        B
    }

    export enum ObjectsButtonEvent {
        //% block="pressed"
        Pressed,
        //% block="released"
        Released,
        //% block="held"
        Held
    }

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

        getLocal(key: string) {
            return this.locals[key];
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
            this._data = { __state: "" };
            this._sprite = null;
        }

        toString() {
            return this.name;
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
    const NOUN_DEFINITION_STACK: NounDefinition[] = [];
    const LOCAL_FRAME_STACK: LocalFrame[] = [];

    function peek(stack: any[]): any {
        if (stack.length > 0) {
            return stack[stack.length - 1];
        }
        return undefined;
    }

    function _executeVerb(instance: NounInstance, verbName: string, passedArgs: any[]): any {
        if (!instance) throw `Block Error: Attempted to call verb '${verbName}' on a null or undefined instance.`;

        if (!instance._verbs || !instance._verbs[verbName]) {
            if (verbName.substr(0, 2) !== "__") {
                throw `Runtime Error: Noun '${instance.name}' cannot execute verb '${verbName}'. Ensure the verb is defined inside objects.defineNoun.`;
            }
            return undefined;
        }

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
    //% blockId="objects_define_noun_block"
    //% group="Definitions"
    //% block="define noun $name"
    //% name.shadow="objects_noun_picker"
    //% handlerStatement=1
    export function defineNoun(name: string, userDefinition: () => void): void {
        if (!name || name.trim() === "") throw `Block Error: objects.defineNoun requires a valid name.`;

        let nounDef = new NounDefinition(name);
        NOUN_DEFINITION_STACK.push(nounDef);
        userDefinition();
        nounRegistry[name] = nounDef;
        NOUN_DEFINITION_STACK.pop();
    }

    /**
     * Defines a verb with arguments.
     */
    //% blockId="objects_define_new_block"
    //% group="Definitions"
    //% block="define new using $argNames"
    //% argNames.shadow="text"
    //% argNames.defl="foo, bar"
    //% handlerStatement=1
    export function defineNew(argNames: string, definition: () => void): void {
        let currentNoun = peek(NOUN_DEFINITION_STACK) as NounDefinition;
        if (!currentNoun) throw `Block Error: 'define new' must be placed inside an objects.defineNoun block.`;

        let parsedNames = argNames.split(",")
            .map(s => s.trim())
            .filter(s => s.length > 0);

        currentNoun._verbs["__new"] = new VerbDefinition(function (self: NounInstance) {
            parsedNames.forEach(function (name) {
                setInstanceProperty(self, name, getLocal(name));
            });
            definition();
        }, parsedNames);
    }

    /**
     * Defines a verb with arguments.
     */
    //% blockId="objects_define_variadic_verb_block"
    //% group="Definitions"
    //% block="define verb $verbName using $argNames"
    //% verbName.shadow="objects_verb_picker"
    //% argNames.shadow="text"
    //% argNames.defl="foo, bar"
    //% handlerStatement=1
    export function defineVariadicVerb(verbName: string, argNames: string, definition: () => void): void {
        let currentNoun = peek(NOUN_DEFINITION_STACK) as NounDefinition;
        if (!currentNoun) throw `Block Error: objects.defineVariadicVerb '${verbName}' must be placed inside an objects.defineNoun block.`;

        let parsedNames = argNames.split(",")
            .map(s => s.trim())
            .filter(s => s.length > 0);
        currentNoun._verbs[verbName] = new VerbDefinition(definition, parsedNames);
    }

    /**
    * Defines a simple verb.
    */
    //% blockId="objects_define_nullary_verb_block"
    //% group="Definitions"
    //% block="define verb $verbName"
    //% verbName.shadow="objects_verb_picker"
    //% handlerStatement=1
    export function defineNullaryVerb(verbName: string, definition: () => void): void {
        let currentNoun = peek(NOUN_DEFINITION_STACK) as NounDefinition;
        if (!currentNoun) throw `Block Error: objects.defineNullaryVerb '${verbName}' must be placed inside an objects.defineNoun block.`;

        currentNoun._verbs[verbName] = new VerbDefinition(definition, []);
    }

    /**
    * Defines a simple verb.
    */
    //% blockId="objects_define_local_frame_block"
    //% group="Definitions"
    //% block="context"
    //% handlerStatement=1
    export function defineLocalFrame(definition: () => void): void {
        let frameBelow = peek(LOCAL_FRAME_STACK) as LocalFrame;
        if (frameBelow) {
            LOCAL_FRAME_STACK.push(new LocalFrame(frameBelow.self, frameBelow.locals));
        } else {
            LOCAL_FRAME_STACK.push(new LocalFrame(null, {}));
        }
        definition();
        LOCAL_FRAME_STACK.pop();
    }

    /**
    * Provide an answer from the current verb.
    */
    //% blockId="objects_answer_block"
    //% group="Definitions"
    //% block="answer with $value"
    export function answer(value: any): void {
        let frame = peek(LOCAL_FRAME_STACK) as LocalFrame;
        if (!frame) throw `Block Error: objects.answer can only be used inside a verb definition or context block.`;
        frame.returnValue = value;
    }

    /**
    * A reference to yourself.
    */
    //% blockId="objects_self_block"
    //% group="Definitions"
    //% block="self"
    export function self(): NounInstance {
        let frame = peek(LOCAL_FRAME_STACK) as LocalFrame;
        if (!frame || !frame.self) throw `Block Error: objects.self() used outside of a valid noun instance context.`;
        return frame.self;
    }

    /**
    * Runs logic at an interval (or every frame) and optionally only in a state.
    */
    //% blockId="objects_on_noun_tick_block"
    //% group="States"
    //% block="on every $interval"
    //% interval.shadow="objects_every_frame_tick_block"
    //% interval.defl="objects_every_frame_tick_block"
    //% handlerStatement=1
    //% weight=10
    export function onTick(interval: number, handler: () => void): void {
        let currentNoun = peek(NOUN_DEFINITION_STACK) as NounDefinition;
        if (!currentNoun) throw `Block Error: objects.onTick must be placed inside an objects.defineNoun block.`;

        let key = "__tick_" + interval;
        currentNoun._verbs[key] = new VerbDefinition(handler, []);

        if (currentNoun._intervals.indexOf(interval) === -1) {
            currentNoun._intervals.push(interval);
        }
    }

    // ==========================================
    // INSTANCES
    // ==========================================

    /**
    * Creates a new instance of a noun.
    */
    //% blockId="objects_new_instance_block"
    //% group="Instances"
    //% block="new $nounName|| using $arg0 $arg1 $arg2 $arg3 $arg4 $arg5 $arg6 $arg7 $arg8 $arg9"
    //% nounName.shadow="objects_noun_picker"
    //% inlineInputMode=inline
    export function newInstance(nounName: string, arg0?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, arg6?: any, arg7?: any, arg8?: any, arg9?: any): NounInstance {
        if (!nounRegistry[nounName]) throw `Runtime Error: Cannot create instance. Noun '${nounName}' is not defined.`;

        let args = [arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9]
        let nounDef = nounRegistry[nounName];
        let it = new NounInstance(nounDef.name, nounDef._verbs);
        allInstances.push(it);
        _executeVerb(it, "__new", args);
        _executeVerb(it, "__onStart", []);
        return it;
    }

    /**
    * Creates a new instance of a noun without returning it.
    */
    //% blockId="objects_new_instance_no_return_block"
    //% group="Instances"
    //% block="new $nounName|| using $arg0 $arg1 $arg2 $arg3 $arg4 $arg5 $arg6 $arg7 $arg8 $arg9"
    //% nounName.shadow="objects_noun_picker"
    //% inlineInputMode=inline
    export function spawn(nounName: string, arg0?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, arg6?: any, arg7?: any, arg8?: any, arg9?: any) {
        if (!nounRegistry[nounName]) throw `Runtime Error: Cannot spawn. Noun '${nounName}' is not defined.`;

        let args = [arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9]
        let nounDef = nounRegistry[nounName];
        let it = new NounInstance(nounDef.name, nounDef._verbs);
        allInstances.push(it);
        _executeVerb(it, "__new", args);
        _executeVerb(it, "__onStart", []);
    }

    /**
     * Gets an array of all instances of a specific noun.
     */
    //% blockId="objects_get_all_instances_of_block"
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
    //% blockId="objects_tell_block"
    //% group="Instances"
    //% block="tell $instance to $verbName|| using $arg0 $arg1 $arg2 $arg3 $arg4 $arg5 $arg6 $arg7 $arg8 $arg9"
    //% instance.shadow="objects_self_block"
    //% instance.defl="objects_self_block"
    //% verbName.shadow="objects_verb_picker"
    //% inlineInputMode=inline
    export function tell(instance: NounInstance, verbName: string, arg0?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, arg6?: any, arg7?: any, arg8?: any, arg9?: any): void {
        if (!instance) throw `Block Error: objects.tell attempted on a null instance.`;
        let args = [arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9]
        _executeVerb(instance, verbName, args);
    }

    /**
    * Asks a noun for an answer.
    */
    //% blockId="objects_ask_block"
    //% group="Instances"
    //% block="ask $instance to $verbName|| using $arg0 $arg1 $arg2 $arg3 $arg4 $arg5 $arg6 $arg7 $arg8 $arg9"
    //% instance.shadow="objects_self_block"
    //% instance.defl="objects_self_block"
    //% verbName.shadow="objects_verb_picker"
    //% inlineInputMode=inline
    export function ask(instance: NounInstance, verbName: string, arg0?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, arg6?: any, arg7?: any, arg8?: any, arg9?: any): any {
        if (!instance) throw `Block Error: objects.ask attempted on a null instance.`;
        let args = [arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9]
        return _executeVerb(instance, verbName, args);
    }

    // ==========================================
    // GETTERS
    // ==========================================

    /**
     * Get a property from a specific instance.
     */
    //% blockId="objects_get_instance_property_block"
    //% group="Getters"
    //% block="$key of $instance"
    //% instance.shadow="objects_self_block"
    //% instance.defl="objects_self_block"
    //% key.shadow="objects_property_picker"
    export function getInstanceProperty(instance: NounInstance, key: string): any {
        if (!instance) throw `Block Error: Attempted to get property '${key}' from a null instance.`;
        if (Object.keys(instance._data).indexOf(key) == -1) {
            throw `Runtime Error: Property '${key}' is undefined on instance '${instance.name}'.`;
        }
        return instance._data[key];
    }

    /**
    * Gets an argument or local variable from the current frame.
    */
    //% blockId="objects_get_verb_local_variable_block"
    //% group="Getters"
    //% block="get $localName"
    export function getLocal(localName: string): any {
        let frame = peek(LOCAL_FRAME_STACK) as LocalFrame;
        if (!frame) throw `Block Error: objects.getLocal '${localName}' used outside of a valid verb definition.`;
        if (frame.locals[localName] === undefined) {
            throw `Runtime Error: Local variable '${localName}' is not defined in the current scope.`;
        }
        return frame.locals[localName];
    }

    /**
     * Gets the noun instance associated with a sprite.
     */
    //% blockId="objects_get_noun_from_sprite_block"
    //% group="Getters"
    //% block="$sprite noun"
    //% sprite.shadow="variables_get"
    export function getNounFromSprite(sprite: Sprite): any {
        if (!sprite) return null;
        return sprite.data["noun_instance"] || null;
    }

    /**
     * Gets the sprite associated with a noun instance.
     */
    //% blockId="objects_get_sprite_from_noun_block"
    //% group="Getters"
    //% block="$instance sprite"
    //% instance.shadow="objects_self_block"
    //% instance.defl="objects_self_block"
    export function getSpriteFromNoun(instance: NounInstance): Sprite {
        if (!instance) return null;
        return instance._sprite || null;
    }

    // ==========================================
    // SETTERS
    // ==========================================

    /**
     * Set a property on a specific instance.
     */
    //% blockId="objects_set_instance_property_block"
    //% group="Setters"
    //% block="set $instance $key to $value"
    //% instance.shadow="objects_self_block"
    //% instance.defl="objects_self_block"
    //% key.shadow="objects_property_picker"
    export function setInstanceProperty(instance: NounInstance, key: string, value: any): void {
        if (!instance) throw `Block Error: Cannot set property '${key}' on a null instance.`;
        instance._data[key] = value;
    }

    /**
    * Sets a variable local to the current verb frame.
    */
    //% blockId="objects_set_verb_local_variable_block"
    //% group="Setters"
    //% block="set $localName to $value"
    export function setLocal(localName: string, value: any): void {
        let frame = peek(LOCAL_FRAME_STACK) as LocalFrame;
        if (!frame) throw `Block Error: objects.setLocal '${localName}' used outside of a valid verb definition.`;
        frame.locals[localName] = value;
    }

    /**
     * Links a noun to a sprite instance.
     */
    //% blockId="objects_set_instance_sprite_block"
    //% group="Setters"
    //% block="set $instance sprite $sprite"
    //% instance.shadow="objects_self_block"
    //% instance.defl="objects_self_block"
    //% sprite.shadow="spritescreate"
    export function setInstanceSprite(sprite: Sprite, instance: NounInstance): void {
        if (!instance) throw `Block Error: Cannot set sprite for a null noun instance.`;
        if (!sprite) throw `Block Error: Cannot link null sprite to instance '${instance.name}'.`;

        instance._sprite = sprite;
        sprite.data["noun_instance"] = instance;
        sprite.onDestroyed(() => {
            const index = allInstances.indexOf(instance);
            if (index > -1) {
                allInstances.splice(index, 1);
            }
            instance._sprite = null;
        });
    }

    /**
    * Links a sprite to a noun instance.
    */
    //% blockId="objects_set_sprite_noun_block"
    //% group="Setters"
    //% block="set $sprite noun $instance"
    //% instance.shadow="objects_self_block"
    //% instance.defl="objects_self_block"
    //% sprite.shadow="variables_get"
    export function setSpriteNoun(sprite: Sprite, instance: NounInstance): void {
        if (!sprite) throw `Block Error: Cannot attach a noun to a null sprite.`;
        if (!instance) throw `Block Error: Cannot attach a null noun to a sprite.`;
        sprite.data["noun_instance"] = instance;
    }

    // ==========================================
    // STATES
    // ==========================================

    /**
     * Changes the state and triggers transition verbs: onExitOldState and onEnterNewState.
     */
    //% blockId="objects_set_state_block"
    //% group="States"
    //% block="set $instance state to $newState"
    //% instance.shadow="objects_self_block"
    //% instance.defl="objects_self_block"
    //% newState.shadow="objects_state_picker"
    export function setState(instance: NounInstance, newState: string): void {
        if (!instance) throw `Block Error: Cannot set state '${newState}' on a null instance.`;

        let oldState = getState(instance);
        if (oldState === newState) return;

        if (oldState) {
            _executeVerb(instance, "__onExit" + oldState, []);
        }
        setInstanceProperty(instance, "__state", newState);
        _executeVerb(instance, "__onEnter" + newState, []);
    }

    /**
     * Gets the current state name of an instance.
     */
    //% blockId="objects_get_state_block"
    //% group="States"
    //% block="$instance state"
    //% instance.shadow="objects_self_block"
    //% instance.defl="objects_self_block"
    export function getState(instance: NounInstance): string {
        if (!instance) throw `Block Error: Cannot get state of a null instance.`;
        return getInstanceProperty(instance, "__state") || undefined;
    }

    /**
    * Logic that runs once when an instance enters a specific state.
    */
    //% blockId="objects_on_enter_state_block"
    //% group="States"
    //% block="on enter $state"
    //% state.shadow="objects_state_picker"
    //% handlerStatement=1
    //% weight=8
    export function onEnterState(state: string, handler: () => void): void {
        let currentNoun = peek(NOUN_DEFINITION_STACK) as NounDefinition;
        if (!currentNoun) throw `Block Error: objects.onEnterState must be placed inside an objects.defineNoun block.`;

        if (state) {
            currentNoun._verbs["__onEnter" + state] = new VerbDefinition(handler, []);
        }
    }

    /**
     * Logic that runs once when an instance leaves a specific state.
     */
    //% blockId="objects_on_exit_state_block"
    //% group="States"
    //% block="on exit $state"
    //% state.shadow="objects_state_picker"
    //% handlerStatement=1
    //% weight=7
    export function onExitState(state: string, handler: () => void): void {
        let currentNoun = peek(NOUN_DEFINITION_STACK) as NounDefinition;
        if (!currentNoun) throw `Block Error: objects.onExitState must be placed inside an objects.defineNoun block.`;

        if (state) {
            currentNoun._verbs["__onExit" + state] = new VerbDefinition(handler, []);
        }
    }

    /**
    * Runs logic at an interval (or every frame) and optionally only in a state.
    */
    //% blockId="objects_on_noun_tick_in_state_block"
    //% group="States"
    //% block="on every $interval when $state"
    //% interval.shadow="objects_every_frame_tick_block"
    //% state.shadow="objects_state_picker"
    //% handlerStatement=1
    //% weight=10
    export function onTickInState(interval: number, state: string, handler: () => void): void {
        let currentNoun = peek(NOUN_DEFINITION_STACK) as NounDefinition;
        if (!currentNoun) throw `Block Error: objects.onTickInState must be placed inside an objects.defineNoun block.`;

        let key = "__tick_" + interval + (state ? "_" + state : "");
        currentNoun._verbs[key] = new VerbDefinition(handler, []);

        if (currentNoun._intervals.indexOf(interval) === -1) {
            currentNoun._intervals.push(interval);
        }
    }

    /**
     * Checks if the instance is currently in a specific state.
     */
    //% blockId="objects_is_in_state_block"
    //% group="States"
    //% block="is $instance $stateName"
    //% instance.shadow="objects_self_block"
    //% instance.defl="objects_self_block"
    //% stateName.shadow="objects_state_picker"
    export function isInState(instance: NounInstance, stateName: string): boolean {
        return getState(instance) === stateName;
    }

    // ==========================================
    // CONTROLS
    // ==========================================

    /**
    * Controller events TODO: description.
    */
    //% blockId="objects_on_button_event_when_state_block"
    //% group="Controls"
    //% block="on $button $event when $state"
    //% state.shadow="objects_state_picker"
    //% button.defl=ObjectsButton.A
    //% event.defl=ObjectsButtonEvent.pressed
    //% handlerStatement=1
    export function onButtonEvent(button: ObjectsButton, event: ObjectsButtonEvent, state: string, handler: () => void): void {
        let currentNoun = peek(NOUN_DEFINITION_STACK) as NounDefinition;
        if (!currentNoun) throw `Block Error: objects.onButtonEvent must be placed inside an objects.defineNoun block.`;

        let key = `__${button}_${event}_${state}`;
        currentNoun._verbs[key] = new VerbDefinition(handler, ["data"]);
    }

    // ==========================================
    // UTILITY
    // ==========================================

    //% blockId="objects_lerp_block"
    //% group="Utility"
    //% block="lerp $start to $end by $amount"
    //% start.defl=0
    //% end.defl=100
    //% amount.defl=0.5
    export function lerp(start: number, end: number, amount: number): number {
        amount = Math.max(0, Math.min(1, amount));
        return start + (end - start) * amount;
    }

    //% blockId="objects_lerp_radians_block"
    //% group="Utility"
    //% block="lerp radians $start to $end by $amount"
    //% amount.defl=0.5
    export function lerpRadians(start: number, end: number, amount: number): number {
        let diff = (end - start + Math.PI) % (2 * Math.PI);
        if (diff < 0) diff += 2 * Math.PI;
        let delta = diff - Math.PI;
        return start + delta * amount;
    }

    //% blockId="objects_as_array_block"
    //% block="$val as array"
    //% group="Utility"
    export function asArray(val: any): any[] {
        return val as any[];
    }

    //% blockId="objects_as_binary_block"
    //% block="$val as binary"
    //% group="Utility"
    export function asBinary(val: any): boolean {
        return val as boolean;
    }

    //% blockId="objects_as_number_block"
    //% block="$val as number"
    //% group="Utility"
    export function asNumber(val: any): number {
        return val as number;
    }

    //% blockId="objects_as_image_block"
    //% block="$val as image"
    //% group="Utility"
    export function asImage(val: any): Image {
        return val as Image;
    }

    //% blockId="objects_as_sprite_block"
    //% block="$val as sprite"
    //% group="Utility"
    export function asSprite(val: any): Sprite {
        return val as Sprite;
    }

    /**
     * A value representing every frame (0 ms).
     */
    //% blockId="objects_every_frame_tick_block"
    //% block="tick"
    //% group="Utility"
    export function everyFrame(): number {
        return 0;
    }

    // ==========================================
    // HIDDEN / AUTOCOMPLETE
    // ==========================================

    //% blockId=objects_noun_picker
    //% block="$noun"
    //% shim=TD_ID
    //% noun.fieldEditor="autocomplete"
    //% noun.fieldOptions.decompileLiterals=true
    //% noun.fieldOptions.key="objects_noun_picker"
    //% blockHidden=true
    export function _nounPicker(noun: string): string {
        return noun;
    }

    //% blockId=objects_verb_picker
    //% block="$verb"
    //% shim=TD_ID
    //% verb.fieldEditor="autocomplete"
    //% verb.fieldOptions.decompileLiterals=true
    //% verb.fieldOptions.key="objects_verb_picker"
    //% blockHidden=true
    export function _verbPicker(verb: string): string {
        return verb;
    }

    //% blockId=objects_property_picker
    //% block="$property"
    //% shim=TD_ID
    //% property.fieldEditor="autocomplete"
    //% property.fieldOptions.decompileLiterals=true
    //% property.fieldOptions.key="objects_property_picker"
    //% blockHidden=true
    export function _propertyPicker(property: string): string {
        return property;
    }

    //% blockId=objects_state_picker
    //% block="$state"
    //% shim=TD_ID
    //% state.fieldEditor="autocomplete"
    //% state.fieldOptions.decompileLiterals=true
    //% state.fieldOptions.key="objects_state_picker"
    //% blockHidden=true
    export function _statePicker(state: string): string {
        return state;
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