'use client';

import React, { useState } from 'react';

// --- TYPES ---

type DieFace = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right';

interface DieState {
    top: number;
    bottom: number;
    front: number;
    back: number;
    left: number;
    right: number;
}

type CommandType = 
    | 'ROLL_FORWARD' 
    | 'ROLL_BACKWARD' 
    | 'ROLL_RIGHT' 
    | 'ROLL_LEFT' 
    | 'ROTATE_CW' 
    | 'ROTATE_CCW';

interface Command {
    id: string;
    type: CommandType;
    description: string;
}

interface HistoryStep {
    stepIndex: number;
    commandDescription: string;
    resultState: DieState;
}

type GamePhase = 'idle' | 'solving' | 'result';

// --- LOGIC ---

// Standard Dice Configuration: Opposite sides sum to 7
const INITIAL_DIE: DieState = {
    top: 1,
    bottom: 6,
    front: 2,
    back: 5,
    right: 3,
    left: 4
};

// Pure function to calculate new die state based on rotation
const applyDieCommand = (current: DieState, cmd: CommandType): DieState => {
    const next = { ...current };

    switch (cmd) {
        case 'ROLL_FORWARD':
            // Top -> Front, Front -> Bottom, Bottom -> Back, Back -> Top
            next.front = current.top;
            next.bottom = current.front;
            next.back = current.bottom;
            next.top = current.back;
            break;
        case 'ROLL_BACKWARD':
            next.back = current.top;
            next.bottom = current.back;
            next.front = current.bottom;
            next.top = current.front;
            break;
        case 'ROLL_RIGHT':
            next.right = current.top;
            next.bottom = current.right;
            next.left = current.bottom;
            next.top = current.left;
            break;
        case 'ROLL_LEFT':
            next.left = current.top;
            next.bottom = current.left;
            next.right = current.bottom;
            next.top = current.right;
            break;
        case 'ROTATE_CW':
            next.right = current.front;
            next.back = current.right;
            next.left = current.back;
            next.front = current.left;
            break;
        case 'ROTATE_CCW':
            next.left = current.front;
            next.back = current.left;
            next.right = current.back;
            next.front = current.right;
            break;
    }
    return next;
};

const generateCommands = (count: number = 5): Command[] => {
    const types: CommandType[] = [
        'ROLL_FORWARD', 'ROLL_BACKWARD', 
        'ROLL_RIGHT', 'ROLL_LEFT', 
        'ROTATE_CW', 'ROTATE_CCW'
    ];

    return Array.from({ length: count }, () => {
        const type = types[Math.floor(Math.random() * types.length)];
        let desc = '';
        switch(type) {
            case 'ROLL_FORWARD': desc = 'Roll Forward'; break;
            case 'ROLL_BACKWARD': desc = 'Roll Backward'; break;
            case 'ROLL_RIGHT': desc = 'Roll Right'; break;
            case 'ROLL_LEFT': desc = 'Roll Left'; break;
            case 'ROTATE_CW': desc = 'Spin 90° Clockwise'; break;
            case 'ROTATE_CCW': desc = 'Spin 90° Counter-Clockwise'; break;
        }
        
        return {
            id: crypto.randomUUID(),
            type,
            description: desc
        };
    });
};

const getRandomFaceToCheck = (): DieFace => {
    const faces: DieFace[] = ['top', 'bottom', 'front', 'back', 'left', 'right'];
    return faces[Math.floor(Math.random() * faces.length)];
};

// --- COMPONENT ---

const InvisibleDiePage: React.FC = () => {
    // Game State
    const [phase, setPhase] = useState<GamePhase>('idle');
    const [commandList, setCommandList] = useState<Command[]>([]);
    const [finalState, setFinalState] = useState<DieState>(INITIAL_DIE);
    const [targetFace, setTargetFace] = useState<DieFace>('top');
    
    // History State (For the audit trail)
    const [gameHistory, setGameHistory] = useState<HistoryStep[]>([]);
    
    // User Input
    const [userAnswer, setUserAnswer] = useState<string>('');

    const startGame = () => {
        const cmds = generateCommands(5); 
        
        const history: HistoryStep[] = [];
        let currentState = { ...INITIAL_DIE };

        // 1. Record Initial State
        history.push({
            stepIndex: 0,
            commandDescription: "Initial Position",
            resultState: { ...currentState }
        });

        // 2. Process Commands and Record History
        cmds.forEach((cmd, index) => {
            currentState = applyDieCommand(currentState, cmd.type);
            history.push({
                stepIndex: index + 1,
                commandDescription: cmd.description,
                resultState: { ...currentState }
            });
        });

        setCommandList(cmds);
        setFinalState(currentState);
        setGameHistory(history);
        setTargetFace(getRandomFaceToCheck());
        setUserAnswer('');
        setPhase('solving');
    };

    const handleSubmit = () => {
        setPhase('result');
    };

    // --- SUB-COMPONENTS FOR VISUALS ---

    // A mini-grid visualization of the die state
    const MiniDieMap = ({ state }: { state: DieState }) => (
        <div className="grid grid-cols-3 grid-rows-4 gap-1 w-20 text-[10px] text-black font-bold leading-none">
            {/* Row 1: Top */}
            <div className="col-start-2 bg-gray-300 rounded flex items-center justify-center h-6">{state.top}</div>
            
            {/* Row 2: Left, Front, Right */}
            <div className="row-start-2 col-start-1 bg-gray-300 rounded flex items-center justify-center h-6">{state.left}</div>
            <div className="row-start-2 col-start-2 bg-blue-200 rounded flex items-center justify-center h-6 border border-blue-400">{state.front}</div>
            <div className="row-start-2 col-start-3 bg-gray-300 rounded flex items-center justify-center h-6">{state.right}</div>
            
            {/* Row 3: Bottom */}
            <div className="row-start-3 col-start-2 bg-gray-300 rounded flex items-center justify-center h-6">{state.bottom}</div>
            
            {/* Row 4: Back */}
            <div className="row-start-4 col-start-2 bg-gray-300 rounded flex items-center justify-center h-6">{state.back}</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-mono select-none">
            
            {/* --- IDLE --- */}
            {phase === 'idle' && (
                <div className="text-center max-w-lg space-y-6 animate-in fade-in zoom-in duration-500">
                    <h1 className="text-4xl font-bold text-purple-400">The Invisible Die</h1>
                    <div className="bg-gray-800 p-8 rounded-lg text-left space-y-6 border border-gray-700 shadow-2xl">
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-pink-400">Protocol: Static Simulation</h2>
                            <p className="text-gray-400 text-sm">
                                Standard Die Configuration. Opposite sides sum to 7.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-900 p-4 rounded border border-gray-600">
                            <div>TOP: <strong>1</strong></div>
                            <div>BOTTOM: <strong>6</strong></div>
                            <div>FRONT: <strong>2</strong></div>
                            <div>BACK: <strong>5</strong></div>
                            <div>LEFT: <strong>4</strong></div>
                            <div>RIGHT: <strong>3</strong></div>
                        </div>

                        <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
                            <li>Start from the standard position shown above.</li>
                            <li>Follow the rotation commands on the left.</li>
                            <li>Determine the final orientation of the target face.</li>
                        </ul>
                    </div>
                    <button 
                        onClick={startGame}
                        className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded font-bold text-lg shadow-[0_0_15px_rgba(147,51,234,0.5)] transition-all"
                    >
                        Begin Simulation
                    </button>
                </div>
            )}

            {/* --- SOLVING PHASE --- */}
            {phase === 'solving' && (
                <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8 items-start justify-center animate-in fade-in zoom-in-95 duration-500">
                    
                    {/* LEFT: INSTRUCTIONS */}
                    <div className="flex-1 w-full bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
                        <div className="flex items-center justify-between mb-6 border-b border-gray-700 pb-4">
                            <h2 className="text-xl font-bold text-pink-400 uppercase tracking-widest">
                                Operations
                            </h2>
                            <div className="text-xs text-gray-500">Apply Sequentially</div>
                        </div>

                        <div className="space-y-4">
                            {/* Start State Indicator */}
                            <div className="flex items-center gap-4 opacity-50 p-2 rounded bg-gray-800/30 border border-gray-700">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-sm">S</div>
                                <div>
                                    <p className="text-gray-400 font-bold text-sm">Start Position</p>
                                    <p className="text-xs text-gray-500">Top: 1, Front: 2, Right: 3</p>
                                </div>
                            </div>

                            {/* Command List */}
                            {commandList.map((cmd, idx) => (
                                <div key={cmd.id} className="flex items-center gap-4 p-3 rounded bg-gray-800 border border-gray-700">
                                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold shadow-lg shadow-purple-900/50 shrink-0">
                                        {idx + 1}
                                    </div>
                                    <p className="text-lg font-bold text-white">{cmd.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: QUESTION */}
                    <div className="flex-1 w-full bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl flex flex-col items-center justify-center min-h-[400px]">
                        <h2 className="text-xl font-bold text-white mb-8 uppercase tracking-widest border-b border-gray-700 pb-4 w-full text-center">
                            Status Check
                        </h2>
                        
                        <div className="text-center space-y-6">
                            <p className="text-gray-400 text-lg">What number is currently on the:</p>
                            <h3 className="text-5xl font-black text-purple-400 uppercase tracking-wider">
                                {targetFace}
                            </h3>
                            
                            <div className="flex justify-center">
                                <input 
                                    type="number" 
                                    autoFocus
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    placeholder="?"
                                    className="w-32 h-32 bg-gray-800 text-white text-6xl font-bold text-center rounded-xl border-2 border-gray-600 focus:border-purple-500 focus:bg-gray-700 focus:outline-none transition-all placeholder-gray-600"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleSubmit}
                            className="mt-12 w-full py-4 bg-purple-600 hover:bg-purple-500 rounded font-bold text-xl shadow-lg uppercase tracking-widest transition-colors"
                        >
                            Verify Orientation
                        </button>
                    </div>
                </div>
            )}

            {/* --- RESULT PHASE --- */}
            {phase === 'result' && (
                <div className="text-center w-full max-w-4xl px-4 pb-20 animate-in fade-in duration-700">
                    {/* Header Section */}
                    <div className="mb-10">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            {parseInt(userAnswer) === finalState[targetFace] ? (
                                <div className="text-6xl">✅</div>
                            ) : (
                                <div className="text-6xl">❌</div>
                            )}
                            <div className="text-left">
                                <h2 className="text-3xl font-bold">
                                    {parseInt(userAnswer) === finalState[targetFace] ? "Spatial Lock Confirmed" : "Orientation Lost"}
                                </h2>
                                <p className="text-gray-400 text-sm uppercase tracking-wider">Mission Debrief</p>
                            </div>
                        </div>

                        <div className="bg-gray-800/50 inline-block px-8 py-4 rounded-lg border border-gray-600">
                            <p className="text-lg">
                                Target Face <span className="text-purple-400 font-bold uppercase">[{targetFace}]</span> was <span className="text-white font-bold text-2xl mx-2">{finalState[targetFace]}</span>
                            </p>
                            {parseInt(userAnswer) !== finalState[targetFace] && (
                                <p className="text-red-400 text-sm mt-1">You input: {userAnswer}</p>
                            )}
                        </div>
                    </div>

                    {/* HISTORY AUDIT TRAIL */}
                    <h3 className="text-left text-xl font-bold text-gray-400 mb-4 border-b border-gray-700 pb-2">Mission Log & State Audit</h3>
                    
                    <div className="space-y-3">
                        {gameHistory.map((step) => {
                            const isInitial = step.stepIndex === 0;
                            return (
                                <div 
                                    key={step.stepIndex}
                                    className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors hover:border-gray-500"
                                >
                                    {/* Left: Command Info */}
                                    <div className="flex items-center gap-4 min-w-[200px]">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isInitial ? 'bg-blue-600' : 'bg-gray-600'}`}>
                                            {isInitial ? 'S' : step.stepIndex}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs text-gray-500 uppercase tracking-widest">
                                                {isInitial ? 'Start' : 'Command'}
                                            </p>
                                            <p className={`font-bold ${isInitial ? 'text-blue-400' : 'text-white'}`}>
                                                {step.commandDescription}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Middle: Text Description of State */}
                                    <div className="flex-1 grid grid-cols-3 gap-y-1 gap-x-4 text-sm text-gray-300 bg-gray-900/50 p-3 rounded">
                                        <div className="text-center">Top: <span className="text-white font-bold">{step.resultState.top}</span></div>
                                        <div className="text-center">Front: <span className="text-white font-bold">{step.resultState.front}</span></div>
                                        <div className="text-center">Right: <span className="text-white font-bold">{step.resultState.right}</span></div>
                                        <div className="text-center opacity-60">Bot: {step.resultState.bottom}</div>
                                        <div className="text-center opacity-60">Back: {step.resultState.back}</div>
                                        <div className="text-center opacity-60">Left: {step.resultState.left}</div>
                                    </div>

                                    {/* Right: Visual Mini Map */}
                                    <div className="hidden sm:block">
                                        <MiniDieMap state={step.resultState} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12">
                        <button 
                            onClick={() => setPhase('idle')}
                            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded font-bold text-lg border border-gray-500 w-full md:w-auto"
                        >
                            Re-Initialize Protocol
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InvisibleDiePage;