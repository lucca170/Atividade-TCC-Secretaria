import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

function GerenciarFaltas() {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const backendUrl = 'http://127.0.0.1:8000';

  // Estados principais
  const [disciplinas, setDisciplinas] = useState([]);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [faltas, setFaltas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados do diálogo de adição
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novaFalta, setNovaFalta] = useState({
    alunoId: '',
    data: new Date().toISOString().split('T')[0],
    justificada: false,
  });

  // Estados de seleção em massa
  const [dataFaltaMassa, setDataFaltaMassa] = useState(new Date().toISOString().split('T')[0]);
  const [alunosSelecionados, setAlunosSelecionados] = useState(new Set());
  const [dialegoFaltaMassaOpen, setDialogoFaltaMassaOpen] = useState(false);

  // Buscar disciplinas do professor
  useEffect(() => {
    const fetchDisciplinas = async () => {
      setLoading(true);
      try {
        const apiUrl = `${backendUrl}/pedagogico/api/disciplinas/`;
        const response = await axios.get(apiUrl, {
          headers: { 'Authorization': `Token ${token}` },
        });
        setDisciplinas(response.data);
      } catch (err) {
        setError('Erro ao carregar disciplinas. Verifique se você é professor.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDisciplinas();
    }
  }, [token, backendUrl]);

  // Buscar alunos e faltas da disciplina selecionada
  useEffect(() => {
    if (!disciplinaSelecionada || !token) return;

    const fetchAlunosEFaltas = async () => {
      setLoading(true);
      try {
        const headers = { 'Authorization': `Token ${token}` };

        // Buscar alunos da turma (através da disciplina)
        const turmaId = disciplinaSelecionada.turma;
        const alunosResponse = await axios.get(
          `${backendUrl}/pedagogico/api/alunos/?turma_id=${turmaId}`,
          { headers }
        );
        setAlunos(alunosResponse.data);

        // Buscar faltas da disciplina
        const faltasResponse = await axios.get(
          `${backendUrl}/pedagogico/api/faltas/?disciplina_id=${disciplinaSelecionada.id}`,
          { headers }
        );
        setFaltas(faltasResponse.data);
        setAlunosSelecionados(new Set());
      } catch (err) {
        setError('Erro ao carregar alunos e faltas.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlunosEFaltas();
  }, [disciplinaSelecionada, token, backendUrl]);

  // Adicionar uma falta individual
  const handleAdicionarFalta = async () => {
    if (!novaFalta.alunoId || !novaFalta.data) {
      setError('Selecione um aluno e uma data.');
      return;
    }

    try {
      const apiUrl = `${backendUrl}/pedagogico/api/faltas/`;
      await axios.post(
        apiUrl,
        {
          aluno: parseInt(novaFalta.alunoId),
          disciplina: disciplinaSelecionada.id,
          data: novaFalta.data,
          justificada: novaFalta.justificada,
        },
        { headers: { 'Authorization': `Token ${token}` } }
      );

      setSuccess('Falta adicionada com sucesso!');
      setDialogOpen(false);
      setNovaFalta({
        alunoId: '',
        data: new Date().toISOString().split('T')[0],
        justificada: false,
      });

      // Recarrega as faltas
      const faltasResponse = await axios.get(
        `${backendUrl}/pedagogico/api/faltas/?disciplina_id=${disciplinaSelecionada.id}`,
        { headers: { 'Authorization': `Token ${token}` } }
      );
      setFaltas(faltasResponse.data);
    } catch (err) {
      setError('Erro ao adicionar falta.');
      console.error(err);
    }
  };

  // Adicionar faltas em massa
  const handleAdicionarFaltaMassa = async () => {
    if (alunosSelecionados.size === 0) {
      setError('Selecione pelo menos um aluno.');
      return;
    }

    try {
      const promises = Array.from(alunosSelecionados).map((alunoId) =>
        axios.post(
          `${backendUrl}/pedagogico/api/faltas/`,
          {
            aluno: parseInt(alunoId),
            disciplina: disciplinaSelecionada.id,
            data: dataFaltaMassa,
            justificada: false,
          },
          { headers: { 'Authorization': `Token ${token}` } }
        )
      );

      await Promise.all(promises);

      setSuccess(`${alunosSelecionados.size} faltas adicionadas com sucesso!`);
      setDialogoFaltaMassaOpen(false);
      setAlunosSelecionados(new Set());

      // Recarrega as faltas
      const faltasResponse = await axios.get(
        `${backendUrl}/pedagogico/api/faltas/?disciplina_id=${disciplinaSelecionada.id}`,
        { headers: { 'Authorization': `Token ${token}` } }
      );
      setFaltas(faltasResponse.data);
    } catch (err) {
      setError('Erro ao adicionar faltas em massa.');
      console.error(err);
    }
  };

  // Deletar uma falta
  const handleDeletarFalta = async (faltaId) => {
    if (window.confirm('Tem certeza que deseja deletar esta falta?')) {
      try {
        await axios.delete(
          `${backendUrl}/pedagogico/api/faltas/${faltaId}/`,
          { headers: { 'Authorization': `Token ${token}` } }
        );

        setSuccess('Falta deletada com sucesso!');

        // Recarrega as faltas
        const faltasResponse = await axios.get(
          `${backendUrl}/pedagogico/api/faltas/?disciplina_id=${disciplinaSelecionada.id}`,
          { headers: { 'Authorization': `Token ${token}` } }
        );
        setFaltas(faltasResponse.data);
      } catch (err) {
        setError('Erro ao deletar falta.');
        console.error(err);
      }
    }
  };

  // Alternar seleção de aluno
  const toggleAlunoSelecionado = (alunoId) => {
    const novoSelecionados = new Set(alunosSelecionados);
    if (novoSelecionados.has(alunoId)) {
      novoSelecionados.delete(alunoId);
    } else {
      novoSelecionados.add(alunoId);
    }
    setAlunosSelecionados(novoSelecionados);
  };

  // Checar se aluno tem falta em uma data
  const temFalta = (alunoId, data) => {
    return faltas.some((f) => f.aluno === alunoId && f.data === data);
  };

  const formatarData = (dataStr) => {
    try {
      const data = new Date(dataStr + 'T00:00:00');
      return data.toLocaleDateString('pt-BR');
    } catch {
      return dataStr;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          📚 Gerenciar Faltas
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Seleção de disciplina */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Selecione uma disciplina:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              {disciplinas.map((disc) => (
                <Button
                  key={disc.id}
                  variant={disciplinaSelecionada?.id === disc.id ? 'contained' : 'outlined'}
                  onClick={() => setDisciplinaSelecionada(disc)}
                  sx={{ minWidth: 150 }}
                >
                  {disc.materia_nome} - {disc.turma_nome}
                </Button>
              ))}
            </Box>

            {/* Mostrar alunos e faltas */}
            {disciplinaSelecionada && (
              <>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setDialogOpen(true)}
                  >
                    Adicionar Falta
                  </Button>
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<AddIcon />}
                    onClick={() => setDialogoFaltaMassaOpen(true)}
                    disabled={alunosSelecionados.size === 0}
                  >
                    Adicionar Faltas em Massa ({alunosSelecionados.size})
                  </Button>
                </Box>

                {/* Tabela de alunos */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={alunosSelecionados.size === alunos.length && alunos.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAlunosSelecionados(new Set(alunos.map((a) => a.id)));
                              } else {
                                setAlunosSelecionados(new Set());
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Aluno</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          Total de Faltas
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                          Ações
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {alunos.map((aluno) => (
                        <TableRow key={aluno.id}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={alunosSelecionados.has(aluno.id)}
                              onChange={() => toggleAlunoSelecionado(aluno.id)}
                            />
                          </TableCell>
                          <TableCell>{aluno.nome}</TableCell>
                          <TableCell align="right">
                            {faltas.filter((f) => f.aluno === aluno.id).length}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => {
                                setNovaFalta({
                                  alunoId: aluno.id,
                                  data: new Date().toISOString().split('T')[0],
                                  justificada: false,
                                });
                                setDialogOpen(true);
                              }}
                              startIcon={<AddIcon />}
                            >
                              Falta
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Historico de faltas */}
                {faltas.length > 0 && (
                  <Paper sx={{ mt: 3, p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Histórico de Faltas
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Aluno</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Justificada</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                              Ações
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {faltas.map((falta) => (
                            <TableRow key={falta.id}>
                              <TableCell>{falta.aluno_nome}</TableCell>
                              <TableCell>{formatarData(falta.data)}</TableCell>
                              <TableCell>{falta.justificada ? '✓' : '✗'}</TableCell>
                              <TableCell align="center">
                                <Button
                                  size="small"
                                  color="primary"
                                  startIcon={<EditIcon />}
                                  onClick={() => navigate(`/editar-falta/${falta.id}`)}
                                  sx={{ mr: 1 }}
                                >
                                  Editar
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  startIcon={<DeleteIcon />}
                                  onClick={() => handleDeletarFalta(falta.id)}
                                >
                                  Deletar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}
              </>
            )}
          </>
        )}
      </Paper>

      {/* Diálogo para adicionar falta individual */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Falta</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {disciplinaSelecionada && (
            <>
              <TextField
                fullWidth
                label="Aluno"
                select
                value={novaFalta.alunoId}
                onChange={(e) => setNovaFalta({ ...novaFalta, alunoId: e.target.value })}
                SelectProps={{
                  native: true,
                }}
                margin="normal"
              >
                <option value="">Selecione um aluno</option>
                {alunos.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.nome}
                  </option>
                ))}
              </TextField>

              <TextField
                fullWidth
                type="date"
                value={novaFalta.data}
                onChange={(e) => setNovaFalta({ ...novaFalta, data: e.target.value })}
                InputLabelProps={{ shrink: true }}
                margin="normal"
              />

              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox
                  checked={novaFalta.justificada}
                  onChange={(e) => setNovaFalta({ ...novaFalta, justificada: e.target.checked })}
                />
                <Typography>Falta justificada</Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleAdicionarFalta} variant="contained" color="primary">
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para faltas em massa */}
      <Dialog open={dialegoFaltaMassaOpen} onClose={() => setDialogoFaltaMassaOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Faltas em Massa</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {alunosSelecionados.size} aluno(s) selecionado(s)
          </Typography>
          <TextField
            fullWidth
            type="date"
            value={dataFaltaMassa}
            onChange={(e) => setDataFaltaMassa(e.target.value)}
            InputLabelProps={{ shrink: true }}
            margin="normal"
            label="Data da Falta"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoFaltaMassaOpen(false)}>Cancelar</Button>
          <Button onClick={handleAdicionarFaltaMassa} variant="contained" color="primary">
            Adicionar {alunosSelecionados.size} Faltas
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default GerenciarFaltas;
