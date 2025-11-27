'use client';

import React, { useState, useEffect } from 'react';

// --- TYPES ---

interface Voxel {
    id: number;
    val: number; // The number on the block (1-27)
    x: number; // 0 (Left) -> 2 (Right)
    y: number; // 0 (Top) -> 2 (Bottom)
    z: number; // 0 (Front) -> 2 (Back)
    active: boolean;
}

type CommandType = 'LASER_X' | 'LASER_Y' | 'LASER_Z' | 'ROTATE_Y';

interface Command {
    id: string;
    type: CommandType;
    description: string;
    targetIndex1?: number; 
    targetIndex2?: number; 
}

interface HistoryStep {
    stepIndex: number;
    commandDescription: string;
    voxelState: Voxel[];
}

type GamePhase = 'idle' | 'memorize' | 'running' | 'question' | 'result';

// --- LOGIC ---

const createCube = (): Voxel[] => {
    const voxels: Voxel[] = [];
    let counter = 1;
    // Standard reading order: Front Slice -> Mid Slice -> Back Slice
    // Within slice: Top-Left to Bottom-Right
    for (let z = 0; z < 3; z++) {
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                voxels.push({
                    id: counter,
                    val: counter,
                    x, y, z,
                    active: true
                });
                counter++;
            }
        }
    }
    return voxels;
};

const deepCopyVoxels = (voxels: Voxel[]): Voxel[] => voxels.map(v => ({ ...v }));

const applyCommand = (currentVoxels: Voxel[], cmd: Command): Voxel[] => {
    const nextVoxels = deepCopyVoxels(currentVoxels);

    if (cmd.type === 'LASER_Z') {
        // Fire Front-to-Back at X, Y
        const { targetIndex1: targetX, targetIndex2: targetY } = cmd;
        nextVoxels.forEach(v => {
            if (v.x === targetX && v.y === targetY) v.active = false;
        });
    } 
    else if (cmd.type === 'LASER_X') {
        // Fire Left-to-Right at Y, Z
        const { targetIndex1: targetY, targetIndex2: targetZ } = cmd;
        nextVoxels.forEach(v => {
            if (v.y === targetY && v.z === targetZ) v.active = false;
        });
    }
    else if (cmd.type === 'LASER_Y') {
        // Fire Top-to-Bottom at X, Z
        const { targetIndex1: targetX, targetIndex2: targetZ } = cmd;
        nextVoxels.forEach(v => {
            if (v.x === targetX && v.z === targetZ) v.active = false;
        });
    }
    else if (cmd.type === 'ROTATE_Y') {
        // Rotate 90 CW around Y axis
        // Formula: x' = 2 - z, z' = x
        nextVoxels.forEach(v => {
            if (!v.active) return; // technically destroyed blocks rotate too, but functionally irrelevant
            const oldX = v.x;
            const oldZ = v.z;
            v.x = 2 - oldZ;
            v.z = oldX;
        });
    }

    return nextVoxels;
};

const generateCommands = (count: number = 4): Command[] => {
    const commands: Command[] = [];
    
    for (let i = 0; i < count; i++) {
        const rand = Math.random();
        
        if (rand < 0.35) {
            // ROTATE (35% chance)
            commands.push({
                id: crypto.randomUUID(),
                type: 'ROTATE_Y',
                description: 'Rotate Cube 90° Clockwise'
            });
        } else {
            // LASER
            const axisRand = Math.random();
            if (axisRand < 0.33) {
                const x = Math.floor(Math.random() * 3);
                const y = Math.floor(Math.random() * 3);
                commands.push({
                    id: crypto.randomUUID(),
                    type: 'LASER_Z',
                    description: `Fire Laser Front-to-Back at Col ${x + 1}, Row ${y + 1}`,
                    targetIndex1: x,
                    targetIndex2: y
                });
            } else if (axisRand < 0.66) {
                const y = Math.floor(Math.random() * 3);
                const z = Math.floor(Math.random() * 3);
                commands.push({
                    id: crypto.randomUUID(),
                    type: 'LASER_X',
                    description: `Fire Laser Side-to-Side at Row ${y + 1}, Depth ${z + 1}`,
                    targetIndex1: y,
                    targetIndex2: z
                });
            } else {
                const x = Math.floor(Math.random() * 3);
                const z = Math.floor(Math.random() * 3);
                commands.push({
                    id: crypto.randomUUID(),
                    type: 'LASER_Y',
                    description: `Fire Laser Top-Down at Col ${x + 1}, Depth ${z + 1}`,
                    targetIndex1: x,
                    targetIndex2: z
                });
            }
        }
    }
    return commands;
};

// --- COMPONENT ---

export default function VoxelCarverPage() {
    // Game State
    const [phase, setPhase] = useState<GamePhase>('idle');
    const [commandList, setCommandList] = useState<Command[]>([]);
    const [finalVoxels, setFinalVoxels] = useState<Voxel[]>([]);
    
    // History
    const [history, setHistory] = useState<HistoryStep[]>([]);

    // Execution
    const [currentCommandIdx, setCurrentCommandIdx] = useState<number>(-1);
    const [showCommandText, setShowCommandText] = useState<boolean>(false);
    
    // User Input: A 3D map string -> string
    // Key format: "z-y-x" (e.g. "0-0-0" is Front Top Left)
    const [userInputs, setUserInputs] = useState<Record<string, string>>({});

    const startGame = () => {
        const initial = createCube();
        const cmds = generateCommands(4); 

        let current = deepCopyVoxels(initial);
        const hist: HistoryStep[] = [];

        hist.push({
            stepIndex: 0,
            commandDescription: "Start Configuration",
            voxelState: deepCopyVoxels(current)
        });

        cmds.forEach((cmd, idx) => {
            current = applyCommand(current, cmd);
            hist.push({
                stepIndex: idx + 1,
                commandDescription: cmd.description,
                voxelState: deepCopyVoxels(current)
            });
        });

        setFinalVoxels(current);
        setCommandList(cmds);
        setHistory(hist);
        setUserInputs({});
        setPhase('memorize');
    };

    // Phase Loop
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (phase === 'memorize') {
            timer = setTimeout(() => {
                setPhase('running');
                setCurrentCommandIdx(0);
                setShowCommandText(false);
            }, 6000); // 6s to memorize numbers
        }
        else if (phase === 'running') {
            if (currentCommandIdx < commandList.length) {
                if (!showCommandText) {
                    timer = setTimeout(() => {
                        setShowCommandText(true);
                    }, 800);
                } else {
                    timer = setTimeout(() => {
                        setShowCommandText(false);
                        setCurrentCommandIdx(prev => prev + 1);
                    }, 4000); 
                }
            } else {
                setPhase('question');
            }
        }

        return () => clearTimeout(timer);
    }, [phase, currentCommandIdx, showCommandText, commandList.length]);

    // Handle Input Change for specific cell
    const handleCellInput = (z: number, y: number, x: number, val: string) => {
        if (val.length > 2) return; // numbers 1-27 max 2 digits
        setUserInputs(prev => ({
            ...prev,
            [`${z}-${y}-${x}`]: val
        }));
    };

    // Calculate Score
    const getResultStats = () => {
        let correct = 0;
        const total = 27;

        for (let z = 0; z < 3; z++) {
            for (let y = 0; y < 3; y++) {
                for (let x = 0; x < 3; x++) {
                    // Find actual voxel at this coord
                    const actualVoxel = finalVoxels.find(v => v.x === x && v.y === y && v.z === z);
                    const actualVal = (actualVoxel && actualVoxel.active) ? actualVoxel.val.toString() : '';
                    
                    // Get user input (default to empty string)
                    const userVal = userInputs[`${z}-${y}-${x}`] || '';

                    if (actualVal === userVal) correct++;
                }
            }
        }
        return { correct, total };
    };

    const handleSubmit = () => {
        setPhase('result');
    };

    // --- SUBCOMPONENTS ---

    // Slice Display (Read Only) - For Memorize & History
    const SliceView = ({ voxels, zIndex, label, highlight = false }: { voxels: Voxel[], zIndex: number, label: string, highlight?: boolean }) => {
        const cells = Array.from({ length: 9 }); 
        return (
            <div className="flex flex-col items-center mx-1">
                <span className="text-[10px] uppercase text-gray-500 mb-1 tracking-wider font-bold">{label}</span>
                <div className={`grid grid-cols-3 gap-1 bg-gray-900 border p-1 rounded ${highlight ? 'border-blue-500' : 'border-gray-700'}`}>
                    {cells.map((_, i) => {
                        const row = Math.floor(i / 3);
                        const col = i % 3;
                        // Find voxel at this position
                        const v = voxels.find(v => v.x === col && v.y === row && v.z === zIndex);
                        const isActive = v && v.active;
                        
                        return (
                            <div 
                                key={i} 
                                className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-sm border ${
                                    isActive 
                                    ? 'bg-gray-800 text-white border-gray-600' 
                                    : 'bg-black text-transparent border-gray-900'
                                }`}
                            >
                                {isActive ? v.val : ''}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Input Slice (Editable) - For Question Phase
    const InputSlice = ({ zIndex, label }: { zIndex: number, label: string }) => {
        const cells = Array.from({ length: 9 });
        return (
            <div className="flex flex-col items-center">
                <h3 className="text-sm font-bold text-red-400 mb-2 uppercase">{label}</h3>
                <div className="grid grid-cols-3 gap-1 bg-gray-800 p-2 rounded border border-gray-700">
                    {cells.map((_, i) => {
                        const row = Math.floor(i / 3);
                        const col = i % 3;
                        const key = `${zIndex}-${row}-${col}`;
                        return (
                            <input
                                key={key}
                                type="text"
                                value={userInputs[key] || ''}
                                onChange={(e) => handleCellInput(zIndex, row, col, e.target.value)}
                                className="w-10 h-10 bg-gray-900 text-white text-center font-bold border border-gray-600 focus:border-red-500 focus:outline-none rounded"
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

    // Result Comparison Slice
    const ResultSlice = ({ zIndex, label }: { zIndex: number, label: string }) => {
        const cells = Array.from({ length: 9 });
        return (
            <div className="flex flex-col items-center">
                <span className="text-xs text-gray-400 mb-1">{label}</span>
                <div className="grid grid-cols-3 gap-1 bg-gray-900 p-1 rounded border border-gray-700">
                    {cells.map((_, i) => {
                        const row = Math.floor(i / 3);
                        const col = i % 3;
                        
                        const actualVoxel = finalVoxels.find(v => v.x === col && v.y === row && v.z === zIndex);
                        const actualVal = (actualVoxel && actualVoxel.active) ? actualVoxel.val.toString() : '';
                        const userVal = userInputs[`${zIndex}-${row}-${col}`] || '';
                        
                        const isMatch = actualVal === userVal;
                        
                        // Styling based on correctness
                        let bg = 'bg-gray-900';
                        let border = 'border-gray-800';
                        let text = 'text-gray-500';

                        if (isMatch) {
                            bg = 'bg-green-900/30';
                            border = 'border-green-600';
                            text = 'text-green-400';
                        } else {
                            bg = 'bg-red-900/30';
                            border = 'border-red-600';
                            text = 'text-red-400';
                        }

                        return (
                            <div 
                                key={i} 
                                className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded border ${bg} ${border} ${text}`}
                                title={`Expected: ${actualVal || 'Empty'}`}
                            >
                                {userVal}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 font-mono select-none">
            
            {/* --- IDLE --- */}
            {phase === 'idle' && (
                <div className="text-center max-w-lg space-y-6 animate-in fade-in zoom-in duration-500">
                    <h1 className="text-5xl font-bold text-red-500 tracking-tighter">VOXEL CARVER II</h1>
                    <div className="bg-gray-900 p-6 rounded-lg text-left space-y-4 border border-red-900/50 shadow-2xl">
                        <h2 className="text-xl font-bold text-red-400 uppercase tracking-widest">Protocol: Numeric Tracking</h2>
                        <ul className="list-disc pl-5 space-y-2 text-gray-400 text-sm">
                            <li><strong>Setup:</strong> A 3x3x3 Cube containing numbers 1-27.</li>
                            <li><strong>Lasers:</strong> Destroy rows/cols.</li>
                            <li><strong>Rotation:</strong> Moves the numbers within the cube.</li>
                            <li><strong>Objective:</strong> Reconstruct the entire grid (Front, Mid, Back).</li>
                        </ul>
                    </div>
                    <button 
                        onClick={startGame}
                        className="px-10 py-4 bg-red-600 hover:bg-red-500 rounded text-white font-bold text-lg shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all uppercase tracking-widest"
                    >
                        Initiate
                    </button>
                </div>
            )}

            {/* --- MEMORIZE --- */}
            {phase === 'memorize' && (
                <div className="text-center animate-in fade-in duration-500">
                    <h2 className="text-2xl mb-2 text-blue-400 font-bold uppercase tracking-[0.3em] animate-pulse">Memorize Layout</h2>
                    <p className="text-gray-500 mb-8 text-sm">Cube initialized. Numbers 1-27.</p>
                    
                    <div className="flex flex-wrap justify-center gap-6">
                        {/* We use the history[0] to show initial state */}
                        {history.length > 0 && (
                            <>
                                <SliceView voxels={history[0].voxelState} zIndex={0} label="Front (1-9)" highlight />
                                <SliceView voxels={history[0].voxelState} zIndex={1} label="Mid (10-18)" highlight />
                                <SliceView voxels={history[0].voxelState} zIndex={2} label="Back (19-27)" highlight />
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* --- RUNNING --- */}
            {phase === 'running' && (
                <div className="text-center w-full max-w-3xl">
                    <div className="flex justify-center gap-2 mb-16">
                        {commandList.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-1 w-16 transition-colors duration-300 ${
                                    idx === currentCommandIdx ? 'bg-red-500 shadow-[0_0_10px_red]' : 
                                    idx < currentCommandIdx ? 'bg-gray-700' : 'bg-gray-900'
                                }`}
                            />
                        ))}
                    </div>

                    <div className="min-h-[200px] flex items-center justify-center relative">
                        {showCommandText && currentCommandIdx < commandList.length ? (
                            <div key={currentCommandIdx} className="animate-in zoom-in-95 fade-in duration-300">
                                <h3 className="text-red-500 text-xs uppercase tracking-[0.3em] mb-6 font-bold">
                                    Sequence {currentCommandIdx + 1}
                                </h3>
                                <div className="text-4xl md:text-5xl font-bold text-white leading-tight max-w-2xl drop-shadow-[0_4px_4px_rgba(0,0,0,1)]">
                                    {commandList[currentCommandIdx].description}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-t-red-500 border-gray-800 rounded-full animate-spin"></div>
                                <span className="text-red-900 font-mono text-xl animate-pulse">PROCESSING GEOMETRY...</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- QUESTION --- */}
            {phase === 'question' && (
                <div className="text-center w-full max-w-4xl animate-in slide-in-from-bottom-8 duration-500">
                    <h2 className="text-3xl font-bold mb-4 text-white">Reconstruct Cube</h2>
                    <p className="text-gray-400 mb-8">Enter remaining numbers. Leave destroyed cells empty.</p>
                    
                    <div className="flex flex-col md:flex-row justify-center gap-8 mb-10">
                        <InputSlice zIndex={0} label="Front Slice" />
                        <InputSlice zIndex={1} label="Mid Slice" />
                        <InputSlice zIndex={2} label="Back Slice" />
                    </div>

                    <button 
                        onClick={handleSubmit}
                        className="px-12 py-4 bg-white text-black hover:bg-gray-200 rounded font-bold text-xl uppercase tracking-widest transition-colors shadow-lg"
                    >
                        Verify Integrity
                    </button>
                </div>
            )}

            {/* --- RESULT --- */}
            {phase === 'result' && (
                <div className="w-full max-w-5xl px-4 pb-20 animate-in fade-in duration-700">
                    {(() => {
                        const { correct, total } = getResultStats();
                        const isPerfect = correct === total;
                        return (
                            <div className="text-center mb-12">
                                <div className="text-6xl mb-4">{isPerfect ? '✅' : '⚠️'}</div>
                                <h2 className={`text-3xl font-bold uppercase tracking-widest mb-2 ${isPerfect ? 'text-green-500' : 'text-yellow-500'}`}>
                                    {isPerfect ? 'Structure Intact' : 'Data Corrupted'}
                                </h2>
                                <p className="text-gray-400 text-lg">
                                    Accuracy: <span className="text-white font-bold">{correct}</span> / {total} Cells
                                </p>
                                
                                <div className="mt-8 flex justify-center gap-8 opacity-90">
                                    <div className="text-left">
                                        <p className="text-xs uppercase text-gray-500 mb-2">Your Input vs Reality</p>
                                        <div className="flex gap-4">
                                            <ResultSlice zIndex={0} label="Front" />
                                            <ResultSlice zIndex={1} label="Mid" />
                                            <ResultSlice zIndex={2} label="Back" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* AUDIT LOG */}
                    <div className="w-full space-y-6">
                        <h3 className="text-left text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2 mb-6">
                            Sequence Audit Trail
                        </h3>
                        
                        {history.map((step) => {
                            const isInitial = step.stepIndex === 0;

                            return (
                                <div 
                                    key={step.stepIndex}
                                    className="bg-gray-900/50 p-6 rounded-lg border border-gray-800 flex flex-col xl:flex-row items-center gap-6 hover:border-gray-700 transition-colors"
                                >
                                    {/* Text Info */}
                                    <div className="xl:w-48 text-center xl:text-left shrink-0">
                                        <div className="flex items-center justify-center xl:justify-start gap-3 mb-2">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isInitial ? 'bg-blue-600' : 'bg-red-600'}`}>
                                                {isInitial ? 'S' : step.stepIndex}
                                            </div>
                                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                                                {isInitial ? 'Start' : 'Action'}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-bold text-white mb-1">{step.commandDescription}</h4>
                                    </div>

                                    {/* Visual Representation */}
                                    <div className="flex flex-wrap justify-center gap-4 p-2 bg-black/40 rounded-lg border border-gray-800">
                                        <SliceView voxels={step.voxelState} zIndex={0} label="Front" />
                                        <SliceView voxels={step.voxelState} zIndex={1} label="Mid" />
                                        <SliceView voxels={step.voxelState} zIndex={2} label="Back" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-16 text-center">
                        <button 
                            onClick={() => setPhase('idle')}
                            className="px-8 py-3 border border-gray-700 hover:bg-gray-800 rounded text-gray-400 font-mono text-sm uppercase tracking-widest transition-colors"
                        >
                            Reset System
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}