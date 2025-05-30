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
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';


import { usePuzzlesList, usePuzzleSolution, usePiecesDetailsFromSolution, useCreatePuzzle, useAddPiece } from '../../hooks/usePuzzle';

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '14px',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          backgroundColor: '#ddd',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 1,
        }}
      >
        <Typography>{edges.join('\n')}</Typography>
      </Box>
    </Box>
  );
}

export default function Page() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPuzzleName, setNewPuzzleName] = useState('');
  const [totalPieces, setTotalPieces] = useState(1);
  const [pieces, setPieces] = useState<{ piece_id: number; edges: any }[]>([
    { piece_id: 1, edges: [] },
  ]);

  const { createPuzzle } = useCreatePuzzle();
  const { addPiece } = useAddPiece();

  const { puzzles, loading: loadingPuzzles, error: errorPuzzles } = usePuzzlesList();
  const [selectedPuzzle, setSelectedPuzzle] = useState<string>('');
  const { solution, loading: loadingSolution, error: errorSolution } = usePuzzleSolution(selectedPuzzle);
  const { piecesMap, loading: loadingPiecesMap, error: errorPiecesMap } = usePiecesDetailsFromSolution(solution);

  const [positions, setPositions] = useState<Record<number, Position>>({});


  const handleSavePuzzle = async () => {
    const puzzleResponse = await createPuzzle({ name: newPuzzleName, total_pieces: totalPieces });

      if (puzzleResponse) {
        for (const piece of pieces) {
          await addPiece({
            puzzle_name: newPuzzleName,
            piece_id: piece.piece_id,
            edges: piece.edges,
          });
        }
        setDialogOpen(false);
        setNewPuzzleName('');
        setPieces([{ piece_id: 1, edges: [] }]);
        setTotalPieces(1);
      }
  };

  useEffect(() => {
    if (!solution || !solution.components.length) {
      setPositions({});
      return;
    }

    const posMap: Record<number, Position> = {};
    const visited = new Set<number>();
    const queue: Array<{ pieceId: number; x: number; y: number }> = [];

    const directionOffsets = {
      up: { x: 0, y: -1 },
      right: { x: 1, y: 0 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
    };

  


  const edgeToDirection: Record<number, keyof typeof directionOffsets> = {
    1: 'right',
    2: 'right',
    3: 'right',
    4: 'down',
    5: 'left',
    6: 'left',
    7: 'down',
    8: 'right',
    9: 'left',
    10: 'down',
    11: 'right',
    12: 'down',
  };

    for (const component of solution.components) {
      const start = component.start_piece;
      if (!visited.has(start)) {
        posMap[start] = { x: 0, y: 0 };
        visited.add(start);
        queue.push({ pieceId: start, x: 0, y: 0 });

        while (queue.length > 0) {
          const { pieceId, x, y } = queue.shift()!;
          const currentConns = component.connections.filter(c => c.from_piece_id === pieceId);

          for (const conn of currentConns) {
            const dir = edgeToDirection[conn.edge_id];
            if (!dir) continue;

            const offset = directionOffsets[dir];
            const nx = x + offset.x;
            const ny = y + offset.y;

            if (!visited.has(conn.piece_id)) {
              posMap[conn.piece_id] = { x: nx, y: ny };
              visited.add(conn.piece_id);
              queue.push({ pieceId: conn.piece_id, x: nx, y: ny });
            }
          }
        }
      }
    }

    setPositions(posMap);

      console.log('Piezas posicionadas:', posMap);

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


      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear nuevo Puzzle</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre del Puzzle"
            margin="normal"
            value={newPuzzleName}
            onChange={(e) => setNewPuzzleName(e.target.value)}
          />
          <TextField
            fullWidth
            label="Total de piezas"
            type="number"
            margin="normal"
            value={totalPieces}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setTotalPieces(value);
              setPieces(Array.from({ length: value }, (_, i) => pieces[i] || { piece_id: i + 1, edges: [] }));
            }}
          />
          {pieces.map((piece, index) => (
            <TextField
            key={index}
            fullWidth
            margin="normal"
            label={`Edges de la pieza ${piece.piece_id} (separados por coma)`}
            value={piece.edges}
            onChange={(e) => {
              const newPieces = [...pieces];
              newPieces[index].edges = e.target.value;
              setPieces(newPieces);
            }}
          />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSavePuzzle} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Button
        variant="contained"
        color="primary"
        onClick={() => setDialogOpen(true)}
      >
        Crear nuevo Puzzle
      </Button>


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
            {Object.entries(positions).map(([pieceIdStr, pos]) => {
  const pieceId = parseInt(pieceIdStr, 10);
  const edges = piecesMap[pieceId] || [];
  return (
    <PieceVisual
      key={pieceId}
      edges={edges}
      style={{
        top: offsetY + pos.y * TILE_SIZE,
        left: offsetX + pos.x * TILE_SIZE,
      }}
    />
  );
})}

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

             {solution && piecesMap && (
              <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                  JSON de Solución
                </Typography>
                <Paper sx={{ padding: 2, maxHeight: 300, overflowY: 'auto', backgroundColor: '#f9f9f9' }}>
                  <pre style={{ fontSize: 12 }}>
                    {JSON.stringify(solution, null, 2)}
                  </pre>
                </Paper>

                <Typography variant="h6" gutterBottom sx={{ marginTop: 2 }}>
                  JSON de piezas
                </Typography>
                <Paper sx={{ padding: 2, maxHeight: 300, overflowY: 'auto', backgroundColor: '#f9f9f9' }}>
                  <pre style={{ fontSize: 12 }}>
                    {JSON.stringify(piecesMap, null, 2)}
                  </pre>
                </Paper>
              </Box>
            )}
    </Box>
  );
}
