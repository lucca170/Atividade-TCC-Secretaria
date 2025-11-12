from rest_framework import viewsets, permissions
from .models import Advertencia, Suspensao
from .serializers import AdvertenciaSerializer, SuspensaoSerializer
from escola.base.permissions import IsCoordenacao, IsProfessor, IsAluno, IsResponsavel

class AdvertenciaViewSet(viewsets.ModelViewSet):
    """
    API endpoint para Advertências.
    Apenas Coordenação pode Criar, Editar ou Deletar.
    Alunos, Professores e Responsáveis podem ver.
    """
    queryset = Advertencia.objects.all()
    serializer_class = AdvertenciaSerializer

    def get_permissions(self):
        """ Define permissões baseadas na ação. """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Apenas Coordenação pode criar, editar ou deletar
            permission_classes = [permissions.IsAuthenticated, IsCoordenacao]
        else: # list, retrieve
            # Todos autenticados podem listar e visualizar
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """ Filtra o queryset com base no 'aluno_id' da URL e no cargo do usuário. """
        queryset = super().get_queryset()
        user = self.request.user
        aluno_id = self.request.query_params.get('aluno_id')

        # Se um aluno_id foi passado, filtre por ele
        if aluno_id:
            queryset = queryset.filter(aluno_id=aluno_id)

        if not hasattr(user, 'cargo'):
            return queryset.none() # Usuário sem cargo (estranho, mas seguro)

        # Aluno só pode ver o seu
        if user.cargo == 'aluno':
            if hasattr(user, 'aluno_profile'):
                return queryset.filter(aluno=user.aluno_profile)
            else:
                return queryset.none() 
        
        # Responsável só pode ver os seus alunos
        if user.cargo == 'responsavel':
            if not aluno_id:
                return queryset.none()
            try:
                if user.responsavel_profile.alunos.filter(id=aluno_id).exists():
                    return queryset
                else:
                    return queryset.none()
            except:
                return queryset.none()
        
        # Admin, Professor, etc. (já filtrado por aluno_id, se fornecido)
        return queryset

class SuspensaoViewSet(viewsets.ModelViewSet):
    """
    API endpoint para Suspensões.
    """
    queryset = Suspensao.objects.all()
    serializer_class = SuspensaoSerializer

    def get_permissions(self):
        """ Define permissões baseadas na ação. """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Apenas Coordenação pode criar, editar ou deletar
            permission_classes = [permissions.IsAuthenticated, IsCoordenacao]
        else:
            # Todos autenticados podem listar e visualizar
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """ Filtra o queryset com base no 'aluno_id' da URL e no cargo do usuário. """
        queryset = super().get_queryset()
        user = self.request.user
        aluno_id = self.request.query_params.get('aluno_id')

        # Se um aluno_id foi passado, filtre por ele
        if aluno_id:
            queryset = queryset.filter(aluno_id=aluno_id)

        if not hasattr(user, 'cargo'):
            return queryset.none()

        # Aluno só pode ver o seu
        if user.cargo == 'aluno':
            if hasattr(user, 'aluno_profile'):
                return queryset.filter(aluno=user.aluno_profile)
            else:
                return queryset.none()
                
        # Responsável só pode ver os seus alunos
        if user.cargo == 'responsavel':
            if not aluno_id:
                 return queryset.none()
            try:
                if user.responsavel_profile.alunos.filter(id=aluno_id).exists():
                    return queryset
                else:
                    return queryset.none()
            except:
                return queryset.none()

        # Admin, Professor, etc. (já filtrado por aluno_id, se fornecido)
        return queryset