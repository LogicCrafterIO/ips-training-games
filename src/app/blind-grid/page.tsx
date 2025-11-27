'use client';

import React, { useState, useEffect } from 'react';

// --- TYPES ---
type Grid = number[][];
type GamePhase = 'idle' | 'flash' | 'blackout' | 'reconstruction' | 'result';

type CommandType = 'ROTATE_CW' | 'SWAP' | 'SET_ROW';

interface Command {
    id: string;
    type: CommandType;
    description: string;
    // Params vary based on type, used for internal logic
    params?: any; 
}

// --- HELPER FUNCTIONS ---

const generateGrid = (): Grid => {
    return Array.from({ length: 3 }, () => 
        Array.from({ length: 3 }, () => Math.floor(Math.random() * 9) + 1)
    );
};

const deepCopyGrid = (grid: Grid): Grid => grid.map(row => [...row]);

// Applies a single command to a grid and returns the new grid state
const applyCommand = (grid: Grid, cmd: Command): Grid => {
    const newGrid = deepCopyGrid(grid);
    const N = 3;

    if (cmd.type === 'ROTATE_CW') {
        // Rotate 90 degrees clockwise
        const rotated = Array.from({ length: N }, () => Array(N).fill(0));
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                rotated[c][N - 1 - r] = newGrid[r][c];
            }
        }
        return rotated;
    } 
    else if (cmd.type === 'SWAP') {
        const { r1, c1, r2, c2 } = cmd.params;
        const temp = newGrid[r1][c1];
        newGrid[r1][c1] = newGrid[r2][c2];
        newGrid[r2][c2] = temp;
        return newGrid;
    } 
    else if (cmd.type === 'SET_ROW') {
        const { row, val } = cmd.params;
        // row comes in as 0-indexed from the generator
        for (let c = 0; c < N; c++) {
            newGrid[row][c] = val;
        }
        return newGrid;
    }

    return newGrid;
};

const generateRandomCommands = (count: number = 3): Command[] => {
    const commands: Command[] = [];
    const types: CommandType[] = ['ROTATE_CW', 'SWAP', 'SET_ROW'];

    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        
        if (type === 'ROTATE_CW') {
            commands.push({
                id: crypto.randomUUID(),
                type: 'ROTATE_CW',
                description: 'Rotate 90° Clockwise'
            });
        } else if (type === 'SWAP') {
            // Use 0-based indexing for logic
            const r1 = Math.floor(Math.random() * 3);
            const c1 = Math.floor(Math.random() * 3);
            let r2 = Math.floor(Math.random() * 3);
            let c2 = Math.floor(Math.random() * 3);
            
            // Ensure we don't swap the same cell
            while (r1 === r2 && c1 === c2) {
                r2 = Math.floor(Math.random() * 3);
            }
            
            // For Description: Convert to 1-based indexing for human readability? 
            // Usually programmers prefer (0,0), but games often use (1,1).
            // Let's stick to (Row, Col) 0-indexed for coordinates to match common array logic, 
            // OR make it explicit "Top-Left" etc. Let's keep (0,0) format but clearly labeled.
            commands.push({
                id: crypto.randomUUID(),
                type: 'SWAP',
                description: `Swap value at (${r1},${c1}) with (${r2},${c2})`,
                params: { r1, c1, r2, c2 }
            });
        } else if (type === 'SET_ROW') {
            const rowIdx = Math.floor(Math.random() * 3); // 0, 1, or 2
            const val = 0; 
            
            // Display: Add 1 so "Row 0" becomes "Row 1" (Top), "Row 1" -> "Row 2" (Middle)
            commands.push({
                id: crypto.randomUUID(),
                type: 'SET_ROW',
                description: `Set Row ${rowIdx + 1} to all Zeros`,
                params: { row: rowIdx, val }
            });
        }
    }
    return commands;
};

// --- COMPONENT ---

const BlindGridPage: React.FC = () => {
    // Game State
    const [phase, setPhase] = useState<GamePhase>('idle');
    const [originalGrid, setOriginalGrid] = useState<Grid>([]);
    const [expectedGrid, setExpectedGrid] = useState<Grid>([]);
    const [userGrid, setUserGrid] = useState<(string)[][]>([]);
    
    // Command Execution State
    const [commandList, setCommandList] = useState<Command[]>([]);
    const [currentCommandIdx, setCurrentCommandIdx] = useState<number>(-1);
    const [showCommandText, setShowCommandText] = useState<boolean>(false);

    // Start Game Logic
    const startGame = () => {
        const initial = generateGrid();
        const cmds = generateRandomCommands(3); // Generate 3 commands
        
        // Calculate final result immediately for validation later
        let final = deepCopyGrid(initial);
        cmds.forEach(cmd => {
            final = applyCommand(final, cmd);
        });

        setOriginalGrid(initial);
        setExpectedGrid(final);
        setCommandList(cmds);
        
        // Reset user input grid
        setUserGrid(Array.from({ length: 3 }, () => Array(3).fill('')));
        
        setPhase('flash');
    };

    // Phase Manager
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (phase === 'flash') {
            // Flash Phase: Show grid for 5 seconds
            timer = setTimeout(() => {
                setPhase('blackout');
                setCurrentCommandIdx(0);
                setShowCommandText(false); // Start hidden to trigger effect
            }, 5000);
        } 
        else if (phase === 'blackout') {
            if (currentCommandIdx < commandList.length) {
                // Sequence: 
                // 1. Brief pause/loading state (500ms) to clear previous command
                // 2. Show command (4000ms)
                
                if (!showCommandText) {
                    // We are in the "gap" between commands
                    timer = setTimeout(() => {
                        setShowCommandText(true);
                    }, 600);
                } else {
                    // We are displaying the command
                    timer = setTimeout(() => {
                        setShowCommandText(false); // Hide text
                        // Move to next command index (this triggers effect again)
                        setCurrentCommandIdx(prev => prev + 1);
                    }, 4000); 
                }
            } else {
                // All commands shown
                setPhase('reconstruction');
            }
        }

        return () => clearTimeout(timer);
    }, [phase, currentCommandIdx, showCommandText, commandList.length]);

    // Handle User Input
    const handleInputChange = (r: number, c: number, value: string) => {
        const newUserGrid = [...userGrid];
        // Only allow numbers
        if (value === '' || /^\d+$/.test(value)) {
            newUserGrid[r][c] = value;
            setUserGrid(newUserGrid);
        }
    };

    // Check Results
    const checkResult = () => {
        setPhase('result');
    };

    // Render Helpers
    const isCorrect = (r: number, c: number) => {
        return parseInt(userGrid[r][c]) === expectedGrid[r][c];
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-mono select-none">
            
            {/* --- IDLE / INTRO PHASE --- */}
            {phase === 'idle' && (
                <div className="text-center max-w-lg space-y-6">
                    <h1 className="text-4xl font-bold text-green-400">The Blind Grid</h1>
                    <div className="bg-gray-800 p-6 rounded-lg text-left space-y-4 border border-gray-700">
                        <h2 className="text-xl font-bold text-yellow-400">Protocol: Matrix Tumbler</h2>
                        <ul className="list-disc pl-5 space-y-2 text-gray-300">
                            <li><strong>Flash Phase:</strong> Memorize the 3x3 grid (5 seconds).</li>
                            <li><strong>Blackout Phase:</strong> Screen goes dark. Update your mental model based on text commands.</li>
                            <li><strong>Reconstruction:</strong> The empty grid returns. Fill in the final numbers.</li>
                        </ul>
                    </div>
                    <button 
                        onClick={startGame}
                        className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded font-bold text-lg transition-colors shadow-[0_0_15px_rgba(22,163,74,0.5)]"
                    >
                        Initialize Sequence
                    </button>
                </div>
            )}

            {/* --- FLASH PHASE --- */}
            {phase === 'flash' && (
                <div className="text-center">
                    <h2 className="text-2xl mb-6 text-blue-400 animate-pulse">MEMORIZE - 5s</h2>
                    <div className="grid grid-cols-3 gap-2 bg-gray-800 p-4 rounded border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                        {originalGrid.map((row, rIdx) => (
                            row.map((num, cIdx) => (
                                <div key={`${rIdx}-${cIdx}`} className="w-20 h-20 flex items-center justify-center text-3xl font-bold bg-gray-700 rounded text-white">
                                    {num}
                                </div>
                            ))
                        ))}
                    </div>
                </div>
            )}

            {/* --- BLACKOUT / COMMAND PHASE --- */}
            {phase === 'blackout' && (
                <div className="text-center w-full max-w-2xl flex flex-col items-center justify-center min-h-[400px]">
                    {currentCommandIdx < commandList.length ? (
                        <div className="w-full">
                            {/* Progress Indicator */}
                            <div className="flex justify-center gap-2 mb-12">
                                {commandList.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`h-2 w-12 rounded-full transition-colors duration-300 ${
                                            idx === currentCommandIdx ? 'bg-green-500' : 
                                            idx < currentCommandIdx ? 'bg-gray-600' : 'bg-gray-800'
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Command Text Area */}
                            <div className="relative min-h-[120px] flex items-center justify-center">
                                {showCommandText ? (
                                    /* We use a key here to force the element to re-mount for animation */
                                    <div key={currentCommandIdx} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <h2 className="text-green-500 mb-2 text-sm uppercase tracking-[0.2em] font-bold">
                                            Command {currentCommandIdx + 1}
                                        </h2>
                                        <div className="text-4xl md:text-5xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                            {commandList[currentCommandIdx].description}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-600 animate-pulse text-xl">
                                        PROCESSING INCOMING TRANSMISSION...
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-500 text-2xl">Initializing Reconstruction...</div>
                    )}
                </div>
            )}

            {/* --- RECONSTRUCTION PHASE --- */}
            {phase === 'reconstruction' && (
                <div className="text-center">
                    <h2 className="text-2xl mb-6 text-yellow-400 font-bold tracking-wider">RECONSTRUCT MATRIX</h2>
                    <div className="grid grid-cols-3 gap-2 bg-gray-800 p-4 rounded border-2 border-yellow-500 mb-8 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                        {userGrid.map((row, rIdx) => (
                            row.map((val, cIdx) => (
                                <input
                                    key={`${rIdx}-${cIdx}`}
                                    type="text"
                                    maxLength={2}
                                    value={val}
                                    onChange={(e) => handleInputChange(rIdx, cIdx, e.target.value)}
                                    className="w-20 h-20 text-center text-3xl font-bold bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-400 focus:bg-gray-600 focus:outline-none transition-colors"
                                />
                            ))
                        ))}
                    </div>
                    <button 
                        onClick={checkResult}
                        className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 rounded font-bold text-lg shadow-lg"
                    >
                        Submit Grid
                    </button>
                </div>
            )}

            {/* --- RESULT PHASE --- */}
            {phase === 'result' && (
                <div className="text-center animate-in fade-in duration-700">
                    <h2 className="text-3xl mb-8 font-bold text-white border-b border-gray-700 pb-4 inline-block">Diagnostics</h2>
                    
                    <div className="flex flex-col md:flex-row gap-12 justify-center mb-10">
                        <div>
                            <h3 className="mb-4 text-gray-400 uppercase tracking-widest text-sm">Your Output</h3>
                            <div className="grid grid-cols-3 gap-2 bg-gray-800 p-3 rounded border border-gray-700">
                                {userGrid.map((row, rIdx) => (
                                    row.map((val, cIdx) => {
                                        const correct = isCorrect(rIdx, cIdx);
                                        return (
                                            <div key={`u-${rIdx}-${cIdx}`} className={`w-16 h-16 flex items-center justify-center text-2xl font-bold rounded border-2 transition-all ${correct ? 'border-green-500 bg-green-900/30 text-green-400' : 'border-red-500 bg-red-900/30 text-red-400'}`}>
                                                {val}
                                            </div>
                                        );
                                    })
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-4 text-gray-400 uppercase tracking-widest text-sm">Target Data</h3>
                            <div className="grid grid-cols-3 gap-2 bg-gray-800 p-3 rounded border border-gray-700">
                                {expectedGrid.map((row, rIdx) => (
                                    row.map((val, cIdx) => (
                                        <div key={`e-${rIdx}-${cIdx}`} className="w-16 h-16 flex items-center justify-center text-2xl font-bold bg-gray-700 text-gray-400 rounded">
                                            {val}
                                        </div>
                                    ))
                                ))}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setPhase('idle')}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded font-bold text-lg shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-colors"
                    >
                        Retry Protocol
                    </button>
                </div>
            )}
        </div>
    );
}

export default BlindGridPage;