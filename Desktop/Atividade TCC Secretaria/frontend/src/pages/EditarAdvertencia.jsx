// Em: frontend/src/pages/EditarAdvertencia.jsx (NOVO ARQUIVO)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
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

function EditarAdvertencia() {
  const navigate = useNavigate();
  const { id } = useParams(); // Pega o ID da advertência da URL
  const token = localStorage.getItem('authToken');
  
  // Estados do formulário
  const [alunoId, setAlunoId] = useState('');
  const [data, setData] = useState('');
  const [motivo, setMotivo] = useState('');
  const [alunoNome, setAlunoNome] = useState(''); // Para exibir o nome
  
  // Estados de controle
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // API URL para o item específico
  const apiUrl = `http://127.0.0.1:8000/disciplinar/api/advertencias/${id}/`;

  // Busca os dados da advertência existente
  useEffect(() => {
    const fetchAdvertencia = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(apiUrl, {
          headers: { 'Authorization': `Token ${token}` }
        });
        const { aluno, aluno_nome, data, motivo } = response.data;
        setAlunoId(aluno);
        setData(data); // A API deve retornar a data no formato YYYY-MM-DD
        setMotivo(motivo);
        setAlunoNome(aluno_nome || 'Aluno');
      } catch (err) {
        setError('Não foi possível carregar os dados da advertência.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdvertencia();
  }, [id, token, apiUrl]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    const advertenciaData = {
      aluno: alunoId, // O ID do aluno não muda
      data: data,
      motivo: motivo,
      // 'registrado_por' é gerenciado pelo backend
    };

    try {
      // Usa o método PUT para atualizar
      await axios.put(apiUrl, advertenciaData, {
        headers: { 'Authorization': `Token ${token}` }
      });

      setSuccess('Advertência atualizada com sucesso! Redirecionando...');
      setIsSubmitting(false);
      
      // Volta para o relatório do aluno
      setTimeout(() => {
        navigate(`/relatorio/aluno/${alunoId}`);
      }, 2000);

    } catch (err) {
      const errorMsg = err.response?.data ? Object.values(err.response.data).join(', ') : 'Erro ao atualizar.';
      setError(`Erro: ${errorMsg}`);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 5 }}>
        <CircularProgress />
        <Typography>Carregando advertência...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, marginY: 4 }}>
        <Typography variant="h4" gutterBottom>
          Editar Advertência
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="aluno-label">Aluno</InputLabel>
            <Select
              labelId="aluno-label"
              value={alunoId}
              label="Aluno"
              disabled // Desabilitado, pois não se deve mudar o aluno
            >
              <MenuItem value={alunoId}>
                {alunoNome}
              </MenuItem>
            </Select>
          </FormControl>
          
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
            <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} /> : "Salvar Alterações"}
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

export default EditarAdvertencia;