'use client';

import React, { useState } from 'react';

// --- TYPES ---
type Grid = number[][];
type GamePhase = 'idle' | 'solving' | 'result';

type CommandType = 'ROTATE_CW' | 'SWAP' | 'SET_ROW';

interface Command {
    id: string;
    type: CommandType;
    description: string;
    params?: {
        r1?: number;
        c1?: number;
        r2?: number;
        c2?: number;
        row?: number;
        val?: number;
    };
}

interface HistoryStep {
    stepIndex: number;
    commandDescription: string;
    gridState: Grid;
}

// --- HELPER FUNCTIONS ---

const generateGrid = (): Grid => {
    return [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
    ];
};

const deepCopyGrid = (grid: Grid): Grid => grid.map(row => [...row]);

const applyCommand = (grid: Grid, cmd: Command): Grid => {
    const newGrid = deepCopyGrid(grid);
    const N = 3;

    if (cmd.type === 'ROTATE_CW') {
        const rotated = Array.from({ length: N }, () => Array(N).fill(0));
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                rotated[c][N - 1 - r] = newGrid[r][c];
            }
        }
        return rotated;
    } 
    else if (cmd.type === 'SWAP') {
        const { r1, c1, r2, c2 } = cmd.params ?? {};
        if (
            typeof r1 === 'number' && typeof c1 === 'number' &&
            typeof r2 === 'number' && typeof c2 === 'number'
        ) {
            const temp = newGrid[r1][c1];
            newGrid[r1][c1] = newGrid[r2][c2];
            newGrid[r2][c2] = temp;
        }
        return newGrid;
    } 
    else if (cmd.type === 'SET_ROW') {
        const { row, val } = cmd.params ?? {};
        if (typeof row === 'number' && typeof val === 'number') {
            for (let c = 0; c < N; c++) {
                newGrid[row][c] = val;
            }
        }
        return newGrid;
    }

    return newGrid;
};

const generateRandomCommands = (count: number = 3): Command[] => {
    const commands: Command[] = [];
    const types: CommandType[] = ['ROTATE_CW', 'SWAP', 'SET_ROW'];

    for (let i = 0; i < count; i++) {
        const rand = Math.random();
        const type = rand < 0.5 ? 'ROTATE_CW' : (rand < 0.8 ? 'SWAP' : 'SET_ROW');
        
        if (type === 'ROTATE_CW') {
            commands.push({
                id: crypto.randomUUID(),
                type: 'ROTATE_CW',
                description: 'Rotate 90° Clockwise'
            });
        } else if (type === 'SWAP') {
            const r1 = Math.floor(Math.random() * 3);
            const c1 = Math.floor(Math.random() * 3);
            let r2 = Math.floor(Math.random() * 3);
            const c2 = Math.floor(Math.random() * 3);
            
            while (r1 === r2 && c1 === c2) {
                r2 = Math.floor(Math.random() * 3);
            }
            
            commands.push({
                id: crypto.randomUUID(),
                type: 'SWAP',
                description: `Swap (${r1},${c1}) with (${r2},${c2})`,
                params: { r1, c1, r2, c2 }
            });
        } else if (type === 'SET_ROW') {
            const rowIdx = Math.floor(Math.random() * 3); 
            const val = 0; 
            
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
    const [expectedGrid, setExpectedGrid] = useState<Grid>([]);
    const [userGrid, setUserGrid] = useState<(string)[][]>([]);
    
    // History & Commands
    const [gameHistory, setGameHistory] = useState<HistoryStep[]>([]);
    const [commandList, setCommandList] = useState<Command[]>([]);

    // Start Game Logic
    const startGame = () => {
        const initial = generateGrid();
        const cmds = generateRandomCommands(4); 
        
        const history: HistoryStep[] = [];
        let currentGridState = deepCopyGrid(initial);

        history.push({
            stepIndex: 0,
            commandDescription: "Start Configuration (1-9)",
            gridState: deepCopyGrid(currentGridState)
        });

        cmds.forEach((cmd, idx) => {
            currentGridState = applyCommand(currentGridState, cmd);
            history.push({
                stepIndex: idx + 1,
                commandDescription: cmd.description,
                gridState: deepCopyGrid(currentGridState)
            });
        });

        setExpectedGrid(currentGridState);
        setCommandList(cmds);
        setGameHistory(history);
        
        setUserGrid(Array.from({ length: 3 }, () => Array(3).fill('')));
        setPhase('solving');
    };

    const handleInputChange = (r: number, c: number, value: string) => {
        const newUserGrid = [...userGrid];
        if (value === '' || /^\d+$/.test(value)) {
            newUserGrid[r][c] = value;
            setUserGrid(newUserGrid);
        }
    };

    // --- ADDED THIS FUNCTION BACK ---
    const checkResult = () => {
        setPhase('result');
    };

    const isCorrect = (r: number, c: number) => {
        return parseInt(userGrid[r][c]) === expectedGrid[r][c];
    };

    const MiniGrid = ({ grid, label }: { grid: Grid, label?: string }) => (
        <div className="flex flex-col items-center">
            {label && <span className="text-xs text-gray-500 mb-1">{label}</span>}
            <div className="grid grid-cols-3 gap-1 bg-gray-900 p-1 rounded border border-gray-700">
                {grid.map((row, rIdx) => (
                    row.map((num, cIdx) => (
                        <div key={`${rIdx}-${cIdx}`} className="w-8 h-8 flex items-center justify-center text-sm font-bold bg-gray-800 text-gray-300 rounded">
                            {num}
                        </div>
                    ))
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 font-mono select-none">
            
            {/* --- IDLE / INTRO PHASE --- */}
            {phase === 'idle' && (
                <div className="text-center max-w-lg space-y-6">
                    <h1 className="text-4xl font-bold text-green-500">The Blind Grid</h1>
                    <div className="bg-gray-900 p-8 rounded-xl text-left space-y-6 border border-gray-800 shadow-2xl">
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-blue-400">Protocol: Static Simulation</h2>
                            <p className="text-gray-400 text-sm">
                                This exercise isolates Spatial Manipulation (IPS) by removing Memory load (PFC).
                            </p>
                        </div>
                        
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-sm font-bold text-gray-300 mb-2">Standard Grid Layout:</h3>
                            <div className="flex justify-center">
                                <MiniGrid grid={[[1,2,3],[4,5,6],[7,8,9]]} />
                            </div>
                        </div>

                        <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
                            <li>The grid <strong>ALWAYS</strong> starts as 1-9.</li>
                            <li>Instructions are shown on the left.</li>
                            <li>Visualize the steps and input the final result on the right.</li>
                        </ul>
                    </div>
                    <button 
                        onClick={startGame}
                        className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded font-bold text-lg transition-colors shadow-[0_0_15px_rgba(22,163,74,0.5)]"
                    >
                        Begin Simulation
                    </button>
                </div>
            )}

            {/* --- SOLVING PHASE (Side-by-Side View) --- */}
            {phase === 'solving' && (
                <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8 items-start justify-center animate-in fade-in zoom-in-95 duration-500">
                    
                    {/* LEFT PANEL: INSTRUCTIONS */}
                    <div className="flex-1 w-full bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
                        <div className="flex items-center justify-between mb-6 border-b border-gray-700 pb-4">
                            <h2 className="text-xl font-bold text-blue-400 uppercase tracking-widest">
                                Operations
                            </h2>
                            <div className="text-xs text-gray-500">Apply Sequentially</div>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Start State Indicator */}
                            <div className="flex items-center gap-4 opacity-50 p-2 rounded bg-gray-800/30">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-sm">S</div>
                                <p className="text-gray-400 font-bold">Start Position (1-9)</p>
                            </div>

                            {/* Command List */}
                            {commandList.map((cmd, idx) => (
                                <div key={cmd.id} className="flex items-center gap-4 p-3 rounded bg-gray-800 border border-gray-700">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold shadow-lg shadow-blue-900/50 shrink-0">
                                        {idx + 1}
                                    </div>
                                    <p className="text-lg font-bold text-white">{cmd.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT PANEL: INPUT */}
                    <div className="flex-1 w-full bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl flex flex-col items-center">
                        <h2 className="text-xl font-bold text-yellow-400 mb-6 uppercase tracking-widest border-b border-gray-700 pb-4 w-full text-center">
                            Result Matrix
                        </h2>
                        
                        <div className="flex-grow flex items-center justify-center mb-8">
                            <div className="grid grid-cols-3 gap-3 bg-gray-800 p-4 rounded border-2 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                                {userGrid.map((row, rIdx) => (
                                    row.map((val, cIdx) => (
                                        <input
                                            key={`${rIdx}-${cIdx}`}
                                            type="text"
                                            maxLength={2}
                                            value={val}
                                            onChange={(e) => handleInputChange(rIdx, cIdx, e.target.value)}
                                            placeholder="?"
                                            className="w-20 h-20 text-center text-3xl font-bold bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-400 focus:bg-gray-600 focus:outline-none transition-all placeholder-gray-600"
                                        />
                                    ))
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={checkResult}
                            className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 rounded font-bold text-xl shadow-lg uppercase tracking-widest"
                        >
                            Verify Pattern
                        </button>
                    </div>
                </div>
            )}

            {/* --- RESULT PHASE --- */}
            {phase === 'result' && (
                <div className="w-full max-w-4xl px-4 pb-20 flex flex-col items-center animate-in fade-in duration-700">
                    <h2 className="text-3xl mb-8 font-bold text-white border-b border-gray-700 pb-4 inline-block">Diagnostics</h2>
                    
                    {/* Comparison Area */}
                    <div className="flex flex-col md:flex-row gap-12 justify-center mb-10 w-full">
                        <div className="flex flex-col items-center">
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

                        <div className="flex flex-col items-center">
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

                    {/* HISTORY AUDIT TRAIL */}
                    <div className="w-full max-w-2xl mt-8">
                        <h3 className="text-left text-xl font-bold text-gray-400 mb-4 border-b border-gray-700 pb-2">Mission Log & State Audit</h3>
                        <div className="space-y-4">
                            {gameHistory.map((step) => {
                                const isInitial = step.stepIndex === 0;
                                return (
                                    <div 
                                        key={step.stepIndex}
                                        className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center justify-between gap-4 transition-colors hover:border-gray-500"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isInitial ? 'bg-blue-600' : 'bg-green-600'}`}>
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
                                        <div>
                                            <MiniGrid grid={step.gridState} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-12">
                        <button 
                            onClick={() => setPhase('idle')}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded font-bold text-lg shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-colors"
                        >
                            Retry Protocol
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BlindGridPage;