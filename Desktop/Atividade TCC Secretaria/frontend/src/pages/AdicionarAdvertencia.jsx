// Em: frontend/src/pages/AdicionarAdvertencia.jsx (NOVO ARQUIVO)

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

function AdicionarAdvertencia() {
  const navigate = useNavigate();
  const query = useQuery();
  const token = localStorage.getItem('authToken');

  // Estados do formulário
  const [alunoId, setAlunoId] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]); // Padrão para hoje
  const [motivo, setMotivo] = useState('');

  // Estados de controle
  const [alunos, setAlunos] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingAlunos, setLoadingAlunos] = useState(true);
  const [alunoIdFromUrl, setAlunoIdFromUrl] = useState(null);
  const [alunoNome, setAlunoNome] = useState('');

  useEffect(() => {
    const alunoIdFromQuery = query.get('alunoId');
    console.log('alunoIdFromQuery:', alunoIdFromQuery);
    
    const fetchAlunos = async () => {
      setLoadingAlunos(true);
      try {
        const apiUrl = 'http://127.0.0.1:8000/pedagogico/api/alunos/';
        const response = await axios.get(apiUrl, {
          headers: { 'Authorization': `Token ${token}` }
        });
        
        if (alunoIdFromQuery) {
          console.log('Definindo alunoIdFromUrl para:', alunoIdFromQuery);
          setAlunoIdFromUrl(alunoIdFromQuery);
          setAlunoId(alunoIdFromQuery);
          const alunoSelecionado = response.data.find(aluno => aluno.id === parseInt(alunoIdFromQuery));
          console.log('Aluno selecionado:', alunoSelecionado);
          if (alunoSelecionado) {
            setAlunos([alunoSelecionado]);
            setAlunoNome(alunoSelecionado.nome);
          }
        } else {
          setAlunos(response.data);
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

    const advertenciaData = {
      aluno: parseInt(alunoId),
      data: data,
      motivo: motivo,
      // 'registrado_por' será preenchido automaticamente pelo backend
    };

    try {
      // A API de Advertência está em /disciplinar/api/advertencias/
      const apiUrl = 'http://127.0.0.1:8000/disciplinar/api/advertencias/';
      
      await axios.post(apiUrl, advertenciaData, {
        headers: { 'Authorization': `Token ${token}` }
      });

      setSuccess('Advertência registrada com sucesso! Redirecionando...');
      setIsSubmitting(false);
      
      // Redireciona de volta para o relatório do aluno
      setTimeout(() => {
        navigate(`/relatorio/aluno/${alunoId}`);
      }, 2000);

    } catch (err) {
      console.error("Erro ao registrar advertência:", err);
      if (err.response && err.response.data) {
         const errors = Object.values(err.response.data).join(', ');
         setError(`Erro ao registrar: ${errors}`);
      } else if (err.response && err.response.status === 403) {
          setError('Você não tem permissão para registrar advertências.');
      } else {
         setError('Erro ao registrar advertência. Verifique os campos.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, marginY: 4 }}>
        <Typography variant="h4" gutterBottom>
          Registrar Nova Advertência
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          
          {alunoIdFromUrl ? (
            <TextField
              label="Aluno"
              value={alunoNome}
              disabled
              fullWidth
              margin="normal"
            />
          ) : (
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
          )}
          
          <TextField
            label="Data da Ocorrência"
            name="data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
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
              {isSubmitting ? <CircularProgress size={24} /> : "Salvar Advertência"}
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

export default AdicionarAdvertencia;