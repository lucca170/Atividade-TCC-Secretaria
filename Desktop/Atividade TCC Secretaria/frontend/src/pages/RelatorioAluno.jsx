// Em: frontend/src/pages/RelatorioAluno.jsx (MODIFICADO)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom'; 
import axios from 'axios';
import { 
    Box, 
    Typography, 
    CircularProgress, 
    Paper, 
    List, 
    ListItem, 
    ListItemText, 
    Button, 
    Divider,
    // --- 1. NOVOS IMPORTS ---
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Alert
} from '@mui/material';
import EditarNotasModal from '../components/EditarNotasModal'; 

// --- 2. NOVOS ÍCONES ---
import AddCommentIcon from '@mui/icons-material/AddComment';
import BlockIcon from '@mui/icons-material/Block';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';


// Definição de Roles (sem alteração)
const getUserRole = () => {
  try {
    const userData = localStorage.getItem('userData');
    if (!userData) return null;
    const user = JSON.parse(userData);
    return user.cargo;
  } catch (e) { return null; }
};
const canEditRoles = ['administrador', 'coordenador', 'diretor', 'ti', 'professor'];
const adminRoles = ['administrador', 'coordenador', 'diretor', 'ti'];

// formatarData (sem alteração)
const formatarData = (dataStr) => {
    try {
        const data = new Date(dataStr);
        data.setUTCDate(data.getUTCDate() + 1); 
        return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (e) { return 'Data inválida'; }
};

function RelatorioAluno() {
    const { alunoId } = useParams(); 
    const token = localStorage.getItem('authToken');
    const backendUrl = 'http://127.0.0.1:8000'; 
    
    // Estados (sem alteração)
    const [alunoData, setAlunoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null); 
    const [advertencias, setAdvertencias] = useState([]);
    const [suspensoes, setSuspensoes] = useState([]);
    const [notas, setNotas] = useState({}); 
    const [loadingNotas, setLoadingNotas] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- 3. ESTADO PARA DIÁLOGO DE EXCLUSÃO ---
    const [dialogOpen, setDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); // { id: null, type: '' }
    const [deleteError, setDeleteError] = useState('');
    const [deleteSuccess, setDeleteSuccess] = useState('');

    // Função para buscar dados disciplinares
    const fetchDisciplinar = useCallback(async () => {
        if (!token) return;
        try {
            const headers = { 'Authorization': `Token ${token}` };
            const apiUrlAdvertencias = `${backendUrl}/disciplinar/api/advertencias/?aluno_id=${alunoId}`;
            const apiUrlSuspensoes = `${backendUrl}/disciplinar/api/suspensoes/?aluno_id=${alunoId}`;

            const [resAdvertencias, resSuspensoes] = await Promise.all([
                axios.get(apiUrlAdvertencias, { headers }),
                axios.get(apiUrlSuspensoes, { headers })
            ]);
            
            setAdvertencias(resAdvertencias.data);
            setSuspensoes(resSuspensoes.data);

        } catch (err) {
             console.error("Erro ao buscar dados disciplinares:", err);
             setError(prev => (prev || '') + ' Erro ao carregar ocorrências.');
        }
    }, [alunoId, token]);

    // useEffect principal (modificado para usar fetchDisciplinar)
    useEffect(() => {
        setUserRole(getUserRole()); 
        
        if (!token) {
            setError('Token de autenticação não encontrado.');
            setLoading(false);
            return;
        }
        
        const apiUrlRelatorio = `${backendUrl}/pedagogico/relatorio/aluno/${alunoId}/`; 

        setLoading(true);
        setError(null);
        setDeleteError('');
        setDeleteSuccess('');

        const fetchDadosIniciais = async () => {
            try {
                const headers = { 'Authorization': `Token ${token}` };
                const resRelatorio = await axios.get(apiUrlRelatorio, { headers });
                setAlunoData(resRelatorio.data);
                
                // Busca dados disciplinares
                await fetchDisciplinar();

            } catch (err) {
                console.error("Erro ao buscar dados do aluno:", err);
                let errorMsg = 'Não foi possível carregar os dados do aluno.';
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                     errorMsg = 'Acesso não autorizado.';
                } else if (err.response && err.response.status === 404) {
                     errorMsg = `Aluno com ID ${alunoId} não encontrado.`;
                }
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };
        
        fetchDadosIniciais();
    }, [alunoId, token, fetchDisciplinar]); 

    // fetchNotas (sem alterações)
    const fetchNotas = useCallback(() => {
        // ... (código existente) ...
    }, [alunoId]); 

    // useEffect para buscar notas (sem alterações)
    useEffect(() => {
        if (alunoData) {
            fetchNotas();
        }
    }, [alunoData, fetchNotas]);

    // --- 4. FUNÇÕES DE EXCLUSÃO ---
    
    // Abre o diálogo de confirmação
    const handleClickDelete = (id, type) => {
        setItemToDelete({ id, type });
        setDialogOpen(true);
        setDeleteError('');
        setDeleteSuccess('');
    };

    // Fecha o diálogo
    const handleCloseDialog = () => {
        setDialogOpen(false);
        setItemToDelete(null);
    };

    // Confirma e executa a exclusão
    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        
        const { id, type } = itemToDelete;
        const apiUrl = `${backendUrl}/disciplinar/api/${type}/${id}/`; // type é 'advertencias' ou 'suspensoes'

        try {
            await axios.delete(apiUrl, {
                headers: { 'Authorization': `Token ${token}` }
            });
            
            setDeleteSuccess('Item excluído com sucesso!');
            // Atualiza a lista localmente
            if (type === 'advertencias') {
                setAdvertencias(prev => prev.filter(item => item.id !== id));
            } else {
                setSuspensoes(prev => prev.filter(item => item.id !== id));
            }
            
        } catch (err) {
            console.error("Erro ao excluir:", err);
            setDeleteError('Erro ao excluir o item. Tente novamente.');
        } finally {
            handleCloseDialog();
        }
    };


    // --- RENDERIZAÇÃO ---

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error" sx={{ mt: 4, mx: 'auto', maxWidth: 900 }}>{error}</Alert>;
    }

    if (!alunoData) {
        return <Typography sx={{ mt: 4, textAlign: 'center' }}>Nenhum dado do aluno encontrado.</Typography>;
    }

    const podeEditarNotas = userRole && canEditRoles.includes(userRole);
    const ehAdmin = userRole && adminRoles.includes(userRole);

    return (
        <Box sx={{ maxWidth: 900, margin: 'auto', padding: 2 }}>
            <Paper elevation={3} sx={{ padding: 3, mb: 3 }}>
                {/* ... (Dados do Aluno - sem alteração) ... */}
                <Typography variant="h4" gutterBottom>Relatório Individual do Aluno</Typography>
                <Typography variant="h6"><strong>Nome:</strong> {alunoData.nome}</Typography>
                {/* ... (outros dados) ... */}

                {/* Área de Botões de Ação (sem alteração) */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3, mb: 2 }}>
                   {/* ... (botões existentes) ... */}
                </Box>
            </Paper>

            {/* Seção de Notas (sem alterações) */}
            <Paper elevation={3} sx={{ padding: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>Boletim de Notas</Typography>
                {/* ... (Tabela de notas existente - sem modificação) ... */}
            </Paper>

            {/* --- 5. SEÇÃO DISCIPLINAR (MODIFICADA) --- */}
            <Paper elevation={3} sx={{ padding: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>Ocorrências Disciplinares</Typography>
                
                {deleteError && <Alert severity="error" onClose={() => setDeleteError('')}>{deleteError}</Alert>}
                {deleteSuccess && <Alert severity="success" onClose={() => setDeleteSuccess('')}>{deleteSuccess}</Alert>}

                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Advertências</Typography>
                {advertencias.length > 0 ? (
                    <List dense>
                        {advertencias.map(adv => (
                            <ListItem 
                                key={adv.id} 
                                sx={{ borderBottom: '1px solid #eee' }}
                                // Adiciona botões de ação
                                secondaryAction={ehAdmin && (
                                    <Box>
                                        <IconButton 
                                            edge="end" 
                                            aria-label="editar" 
                                            component={RouterLink}
                                            to={`/editar-advertencia/${adv.id}`}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            edge="end" 
                                            aria-label="excluir" 
                                            onClick={() => handleClickDelete(adv.id, 'advertencias')}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                )}
                            >
                                <ListItemText 
                                    primary={adv.motivo}
                                    secondary={`Data: ${formatarData(adv.data)} - Registrado por: ${adv.registrado_por_nome}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body2">Nenhuma advertência registrada.</Typography>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>Suspensões</Typography>
                {suspensoes.length > 0 ? (
                    <List dense>
                        {suspensoes.map(susp => (
                            <ListItem 
                                key={susp.id} 
                                sx={{ borderBottom: '1px solid #eee' }}
                                secondaryAction={ehAdmin && (
                                    <Box>
                                        <IconButton 
                                            edge="end" 
                                            aria-label="editar"
                                            component={RouterLink}
                                            to={`/editar-suspensao/${susp.id}`}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            edge="end" 
                                            aria-label="excluir"
                                            onClick={() => handleClickDelete(susp.id, 'suspensoes')}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                )}
                            >
                                <ListItemText 
                                    primary={susp.motivo}
                                    secondary={`Período: ${formatarData(susp.data_inicio)} a ${formatarData(susp.data_fim)}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body2">Nenhuma suspensão registrada.</Typography>
                )}
            </Paper>

            {/* Modal de Edição de Notas (sem alterações) */}
            {podeEditarNotas && (
                <EditarNotasModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    alunoId={alunoId}
                    turmaId={alunoData.turma} 
                    onSave={fetchNotas} 
                />
            )}

            {/* --- 6. DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO --- */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
            >
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Você tem certeza que deseja excluir esta ocorrência? 
                        Esta ação não pode ser desfeita.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error">
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}

export default RelatorioAluno;