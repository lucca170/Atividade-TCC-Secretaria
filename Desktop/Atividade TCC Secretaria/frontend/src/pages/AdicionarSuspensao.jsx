// Em: frontend/src/pages/AdicionarSuspensao.jsx (NOVO ARQUIVO)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

// Hook para pegar query params da URL (ex: ?alunoId=1)
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function AdicionarSuspensao() {
  const navigate = useNavigate();
  const query = useQuery();
  const token = localStorage.getItem('authToken');

  // Estados do formulário
  const [alunoId, setAlunoId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [motivo, setMotivo] = useState('');

  // Estados de controle
  const [alunos, setAlunos] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingAlunos, setLoadingAlunos] = useState(true);

  // Busca a lista de todos os alunos para o <Select>
  useEffect(() => {
    const fetchAlunos = async () => {
      setLoadingAlunos(true);
      try {
        const apiUrl = 'http://127.0.0.1:8000/pedagogico/api/alunos/';
        const response = await axios.get(apiUrl, {
          headers: { 'Authorization': `Token ${token}` }
        });
        setAlunos(response.data);
        
        // Verifica se um ID de aluno foi passado pela URL
        const alunoIdFromQuery = query.get('alunoId');
        if (alunoIdFromQuery) {
          setAlunoId(alunoIdFromQuery);
        }
        
      } catch (err) {
        setError('Não foi possível carregar a lista de alunos.');
      } finally {
        setLoadingAlunos(false);
      }
    };
    fetchAlunos();
  }, [token, query]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    const suspensaoData = {
      aluno: parseInt(alunoId),
      data_inicio: dataInicio,
      data_fim: dataFim,
      motivo: motivo,
    };

    try {
      // A API de Suspensão está em /disciplinar/api/suspensoes/
      const apiUrl = 'http://127.0.0.1:8000/disciplinar/api/suspensoes/';
      
      await axios.post(apiUrl, suspensaoData, {
        headers: { 'Authorization': `Token ${token}` }
      });

      setSuccess('Suspensão registrada com sucesso! Redirecionando...');
      setIsSubmitting(false);
      
      // Redireciona de volta para o relatório do aluno
      setTimeout(() => {
        navigate(`/relatorio/aluno/${alunoId}`);
      }, 2000);

    } catch (err) {
      console.error("Erro ao registrar suspensão:", err);
      if (err.response && err.response.data) {
         const errors = Object.values(err.response.data).join(', ');
         setError(`Erro ao registrar: ${errors}`);
      } else if (err.response && err.response.status === 403) {
          setError('Você não tem permissão para registrar suspensões.');
      } else {
         setError('Erro ao registrar suspensão. Verifique os campos.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, marginY: 4 }}>
        <Typography variant="h4" gutterBottom>
          Registrar Nova Suspensão
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          
          <FormControl fullWidth margin="normal" required disabled={loadingAlunos}>
            <InputLabel id="aluno-label">Aluno</InputLabel>
            <Select
              labelId="aluno-label"
              value={alunoId}
              label="Aluno"
              onChange={(e) => setAlunoId(e.target.value)}
            >
              {loadingAlunos && <MenuItem value=""><em>Carregando alunos...</em></MenuItem>}
              {alunos.map((aluno) => (
                <MenuItem key={aluno.id} value={aluno.id}>
                  {aluno.nome} (Turma: {aluno.turma_nome})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="Data de Início"
            name="data_inicio"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            required fullWidth margin="normal"
            InputLabelProps={{ shrink: true }}
            disabled={isSubmitting}
          />
          
          <TextField
            label="Data de Fim"
            name="data_fim"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            required fullWidth margin="normal"
            InputLabelProps={{ shrink: true }}
            disabled={isSubmitting}
          />

          <TextField
            label="Motivo"
            name="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required fullWidth margin="normal"
            multiline rows={3}
            disabled={isSubmitting}
          />
          
          {error && ( <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> )}
          {success && ( <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert> )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button type="submit" variant="contained" color="primary" disabled={isSubmitting || loadingAlunos}>
              {isSubmitting ? <CircularProgress size={24} /> : "Salvar Suspensão"}
            </Button>
            <Button variant="outlined" onClick={() => navigate(-1)} disabled={isSubmitting}>
              Cancelar
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default AdicionarSuspensao;