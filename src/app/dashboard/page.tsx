'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

import { usePuzzlesList, usePuzzleSolution, usePiecesDetailsFromSolution } from '../../hooks/usePuzzle';

type Position = { x: number; y: number };

const DIRECTION_OFFSETS: Record<string, Position> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

const EDGE_TO_DIRECTION: Record<number, keyof typeof DIRECTION_OFFSETS> = {
  501: 'up',
  502: 'right',
  503: 'left',
  504: 'down',
  505: 'right',
  506: 'left',
  507: 'down',
};

type Piece = {
  id: number;
  edges: number[];
};

function PieceVisual({ edges, style }: { edges: number[]; style?: React.CSSProperties }) {
  const top = edges[0];
  const right = edges[1];
  const bottom = edges[2];
  const left = edges[3];

  return (
    <Box
      style={style}
      sx={{
        width: 120,
        height: 120,
        border: '3px solid #555',
        borderRadius: '10px',
        position: 'absolute',
        userSelect: 'none',
        backgroundColor: '#fff',
        boxShadow: 3,
        textAlign: 'center',
      }}
    >
      {top !== undefined && (
        <Typography
          sx={{
            position: 'absolute',
            top: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            fontWeight: 'bold',
          }}
        >
          {top}
        </Typography>
      )}
      {right !== undefined && (
        <Typography
          sx={{
            position: 'absolute',
            top: '50%',
            right: -30,
            transform: 'translateY(-50%)',
            fontWeight: 'bold',
          }}
        >
          {right}
        </Typography>
      )}
      {bottom !== undefined && (
        <Typography
          sx={{
            position: 'absolute',
            bottom: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            fontWeight: 'bold',
          }}
        >
          {bottom}
        </Typography>
      )}
      {left !== undefined && (
        <Typography
          sx={{
            position: 'absolute',
            top: '50%',
            left: -30,
            transform: 'translateY(-50%)',
            fontWeight: 'bold',
          }}
        >
          {left}
        </Typography>
      )}

      <Box
        sx={{
          width: 80,
          height: 80,
          backgroundColor: '#ddd',
          margin: 'auto',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: 2,
        }}
      />
    </Box>
  );
}

export default function Page() {
  const { puzzles, loading: loadingPuzzles, error: errorPuzzles } = usePuzzlesList();
  const [selectedPuzzle, setSelectedPuzzle] = useState<string>('');
  const { solution, loading: loadingSolution, error: errorSolution } = usePuzzleSolution(selectedPuzzle);
  const { piecesMap, loading: loadingPiecesMap, error: errorPiecesMap } = usePiecesDetailsFromSolution(solution);

  const [positions, setPositions] = useState<Record<number, Position>>({});

  useEffect(() => {
    if (!solution || !solution.components.length) {
      setPositions({});
      return;
    }

    const posMap: Record<number, Position> = {};
    const visited = new Set<number>();
    const queue: Array<{ pieceId: number; x: number; y: number }> = [];

    const connMap: Record<number, Array<{ piece_id: number; edge_id: number }>> = {};

    solution.components.forEach(component => {
      if (!connMap[component.start_piece]) connMap[component.start_piece] = [];
      component.connections.forEach(conn => {
        connMap[component.start_piece].push(conn);
        if (!connMap[conn.piece_id]) connMap[conn.piece_id] = [];
        connMap[conn.piece_id].push({ piece_id: component.start_piece, edge_id: conn.edge_id });
      });
    });

    for (const component of solution.components) {
      if (!visited.has(component.start_piece)) {
        queue.push({ pieceId: component.start_piece, x: 0, y: 0 });
        posMap[component.start_piece] = { x: 0, y: 0 };
        visited.add(component.start_piece);
        console.log(`Inicio BFS en pieza ${component.start_piece} con posición (0,0)`);

        while (queue.length > 0) {
          const { pieceId, x, y } = queue.shift()!;
          console.log(`Visitando pieza ${pieceId} en posición (${x},${y})`);

          const neighbors = connMap[pieceId] || [];
          for (const neighbor of neighbors) {
            if (visited.has(neighbor.piece_id)) {
              console.log(`  Pieza ${neighbor.piece_id} ya visitada`);
              continue;
            }

            const direction = EDGE_TO_DIRECTION[neighbor.edge_id];
            if (!direction) {
              console.log(`  Edge ${neighbor.edge_id} no tiene dirección asignada`);
              continue;
            }

            const offset = DIRECTION_OFFSETS[direction];
            const newX = x + offset.x;
            const newY = y + offset.y;

            // Asignamos posición sin desplazar aunque esté ocupada
            posMap[neighbor.piece_id] = { x: newX, y: newY };
            visited.add(neighbor.piece_id);
            queue.push({ pieceId: neighbor.piece_id, x: newX, y: newY });

            console.log(`  Agregando pieza ${neighbor.piece_id} en posición (${newX},${newY}) por conexión con edge ${neighbor.edge_id} en dirección ${direction}`);
          }
        }
      }
    }

    setPositions(posMap);
  }, [solution]);



  const TILE_SIZE = 140;

  // Para centrar, calculamos offset según min/max posiciones calculadas
  const xs = Object.values(positions).map(pos => pos.x);
  const ys = Object.values(positions).map(pos => pos.y);
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 0);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 0);
  const boardWidth = (maxX - minX + 1) * TILE_SIZE;
  const boardHeight = (maxY - minY + 1) * TILE_SIZE;
  const offsetX = -minX * TILE_SIZE;
  const offsetY = -minY * TILE_SIZE;

  const handleSelectPuzzle = (event: any) => {
    setSelectedPuzzle(event.target.value as string);
  };

  return (
    <Box sx={{ maxWidth: 1000, margin: 'auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Puzzle Solver
      </Typography>

      <FormControl fullWidth margin="normal" disabled={loadingPuzzles || Boolean(errorPuzzles)}>
        <InputLabel id="puzzle-select-label">Selecciona un Puzzle</InputLabel>
        <Select
          labelId="puzzle-select-label"
          value={selectedPuzzle}
          label="Selecciona un Puzzle"
          onChange={handleSelectPuzzle}
        >
          {puzzles.map((puzzle) => (
            <MenuItem key={puzzle.name} value={puzzle.name}>
              {puzzle.name} ({puzzle.current_pieces}/{puzzle.total_pieces})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {(loadingSolution || loadingPiecesMap) && <Typography>Cargando solución...</Typography>}
      {(errorSolution || errorPiecesMap) && <Typography color="error">Error: {errorSolution || errorPiecesMap}</Typography>}

      <Box
        sx={{
          position: 'relative',
          height: boardHeight,
          width: boardWidth,
          border: '1px solid #ccc',
          marginTop: 3,
          backgroundColor: '#fafafa',
        }}
      >
        {solution && !loadingPiecesMap && Object.keys(positions).length > 0 && (
          <>
            {solution.components.flatMap((component) =>
              component.connections.map((conn) => {
                const edges = piecesMap[conn.piece_id] || [];
                const pos = positions[conn.piece_id];
                if (!pos) return null;
                return (
                  <PieceVisual
                    key={conn.piece_id}
                    edges={edges}
                    style={{
                      top: offsetY + pos.y * TILE_SIZE,
                      left: offsetX + pos.x * TILE_SIZE,
                    }}
                  />
                );
              })
            )}
            {/* Render pieza inicial */}
            {solution.components.map((component) => {
              const startPos = positions[component.start_piece];
              const startEdges = piecesMap[component.start_piece] || [];
              return (
                <PieceVisual
                  key={component.start_piece}
                  edges={startEdges}
                  style={{
                    top: offsetY + startPos?.y * TILE_SIZE,
                    left: offsetX + startPos?.x * TILE_SIZE,
                  }}
                />
              );
            })}
          </>
        )}
      </Box>
    </Box>
  );
}
