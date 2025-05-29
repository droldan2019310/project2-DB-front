import { useState, useEffect } from 'react';
import axiosInstance from './axiosInstance'; // ajusta la ruta según tu proyecto

type Connection = {
  piece_id: number;
  edge_id: number;
  from_piece_id: number;
};

type Component = {
  start_piece: number;
  connections: Connection[];
};

type Solution = {
  puzzle_name: string;
  components: Component[];
};

export function usePuzzleSolution(puzzleName: string, startPieceId?: number) {
  const [solution, setSolution] = useState<Solution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!puzzleName) return;

    setLoading(true);
    setError(null);

    const queryParam = startPieceId ? `?start_piece_id=${startPieceId}` : '';
    axiosInstance
      .get(`/api/solution/${encodeURIComponent(puzzleName)}${queryParam}`)
      .then((response) => {
        setSolution(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [puzzleName, startPieceId]);

  return { solution, loading, error };
}

type Puzzle = {
  name: string;
  total_pieces: number;
  current_pieces: number;
};

export function usePuzzlesList() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    axiosInstance
      .get('/api/puzzles')
      .then((response) => {
        setPuzzles(response.data.puzzles || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Error al cargar puzzles');
        setLoading(false);
      });
  }, []);

  return { puzzles, loading, error };
}


type PieceDetailsMap = {
  [pieceId: number]: number[]; // piece_id => edges array
};

type PuzzlePiecesResponse = {
  puzzle_name: string;
  pieces: { piece_id: number; edges: number[] }[];
};


/**
 * Hook que carga los detalles de piezas dado un objeto solution con puzzle_name
 * @param solution objeto solution obtenido del endpoint de solución
 * @returns { piecesMap, loading, error }
 */
export function usePiecesDetailsFromSolution(solution: Solution | null) {
  const [piecesMap, setPiecesMap] = useState<PieceDetailsMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!solution || !solution.puzzle_name) {
      setPiecesMap({});
      return;
    }

    setLoading(true);
    setError(null);

    axiosInstance
      .get<PuzzlePiecesResponse>(`/api/puzzle/${encodeURIComponent(solution.puzzle_name)}/pieces`)
      .then((response) => {
        const map: PieceDetailsMap = {};
        response.data.pieces.forEach((p) => {
          map[p.piece_id] = p.edges;
        });
        setPiecesMap(map);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Error al cargar detalles de piezas');
        setLoading(false);
      });
  }, [solution]);

  return { piecesMap, loading, error };
}



export const useCreatePuzzle = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPuzzle = async (puzzle: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post('/api/puzzle', puzzle);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error creating puzzle');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createPuzzle, loading, error };
};

interface Piece {
  puzzle_name: string;
  piece_id: number;
  edges: string[];
}

export const useAddPiece = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPiece = async (piece: Piece) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post('/api/piece', piece);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error adding piece');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { addPiece, loading, error };
};