from rest_framework import serializers

from ai_engine.services.crag import CRAGService

from .models import ChatMessage, ChatSession


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ('id', 'role', 'content', 'created_at')
        read_only_fields = ('id', 'created_at')


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ('id', 'title', 'created_at', 'messages')
        read_only_fields = ('id', 'created_at', 'messages')


class ChatAskSerializer(serializers.Serializer):
    message = serializers.CharField()

    def save(self, **kwargs):
        request = self.context['request']
        session: ChatSession = self.context['session']
        question = self.validated_data['message']

        ChatMessage.objects.create(session=session, role=ChatMessage.Role.USER, content=question)

        crag = CRAGService(max_retries=2)
        contexts = crag.retry_logic(user_id=request.user.id, question=question)
        answer_payload = crag.generate_answer(question=question, contexts=contexts, mode='chat')
        answer_text = answer_payload.get('answer') or str(answer_payload)

        ChatMessage.objects.create(session=session, role=ChatMessage.Role.ASSISTANT, content=answer_text)
        return {'answer': answer_text, 'context_hits': len(contexts)}
