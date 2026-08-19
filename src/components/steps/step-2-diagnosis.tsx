import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import {
  answeredDiagnosisCount,
  diagnosisQuestions,
  selectDiagnosisOption,
  summarizeDiagnosis,
  type DiagnosisProfile,
  type DiagnosisQuestionId,
} from '@/lib/onboarding-diagnosis';
import { GENERAL_MBTI_OPTIONS, type GeneralMbti } from '@/lib/investment-type';
import { cn } from '@/lib/utils';
import { useFlowStore } from '@/stores/use-flow-store';

export function Step2Diagnosis() {
  const savedAnswers = useFlowStore((state) => state.diagnosisAnswers);
  const saveDiagnosis = useFlowStore((state) => state.saveDiagnosis);
  const [profile, setProfile] = useState<DiagnosisProfile>(savedAnswers);

  const summary = useMemo(() => summarizeDiagnosis(profile), [profile]);
  const answeredCount = answeredDiagnosisCount(profile);

  function choose(questionId: DiagnosisQuestionId, optionId: string) {
    setProfile((current) => selectDiagnosisOption(current, questionId, optionId));
  }

  function chooseMbti(mbti: GeneralMbti) {
    setProfile((current) => ({ ...current, generalMbti: mbti }));
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-6 p-4 pb-12">
      <View className="gap-2">
        <Text className="text-lg font-extrabold text-foreground">내 투자 거울 설정</Text>
        <Text className="text-[13px] leading-5 text-muted-foreground">
          정답이나 위험등급을 매기는 설문이 아니에요. 4개의 해석 기준과 4개의 자기 예상을 받아 실제
          거래 기록과 중립적으로 비교합니다. 답변은 거래 기반 점수를 바꾸지 않아요.
        </Text>
      </View>

      <Card>
        <CardContent className="gap-2 pt-2">
          <Text className="text-sm font-bold text-foreground">설정 미리보기</Text>
          <Text className="text-[13px] leading-5 text-foreground">{summary.headline}</Text>
          <Text className="text-[11px] text-muted-foreground">
            {answeredCount}/8개 응답 · 언제든 수정하거나 나중에 답할 수 있어요.
          </Text>
        </CardContent>
      </Card>

      <View className="gap-4">
        {diagnosisQuestions.map((question, index) => {
          const current = profile[question.id];
          return (
            <View
              key={question.id}
              className="gap-2.5 rounded-2xl border border-border bg-card p-4"
            >
              <View className="gap-1">
                <Text className="text-[11px] font-extrabold text-primary">
                  {question.block === 'context' ? 'A · 해석 기준' : 'B · 내 예상'} {index + 1}/8
                  {question.multiple ? ' · 최대 2개' : ''}
                </Text>
                <Text className="text-[15px] font-extrabold text-foreground">{question.title}</Text>
                <Text className="text-xs leading-5 text-muted-foreground">
                  {question.description}
                </Text>
              </View>
              <View className="gap-2">
                {question.options.map((option) => {
                  const selected = Array.isArray(current)
                    ? current.includes(option.id)
                    : current === option.id;
                  return (
                    <Button
                      key={option.id}
                      variant={selected ? 'default' : 'outline'}
                      className={cn('justify-start', selected && 'border-primary')}
                      onPress={() => choose(question.id, option.id)}
                    >
                      <Text className={selected ? 'text-primary-foreground' : 'text-foreground'}>
                        {option.label}
                      </Text>
                    </Button>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>

      <View className="gap-2.5 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
        <View className="gap-1">
          <Text className="text-[11px] font-extrabold text-primary">선택 · 평소 MBTI</Text>
          <Text className="text-[15px] font-extrabold text-foreground">
            평소 MBTI를 알고 있다면 골라 주세요
          </Text>
          <Text className="text-xs leading-5 text-muted-foreground">
            입력하지 않아도 괜찮아요. 이 값은 투자 점수 계산에 쓰지 않고, 거래 기록 기반 투자거울
            타입과 비교하는 데만 사용합니다.
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {GENERAL_MBTI_OPTIONS.map((mbti) => {
            const selected = profile.generalMbti === mbti;
            const label =
              mbti === 'unknown' ? '모르겠어요' : mbti === 'no_input' ? '입력하지 않기' : mbti;
            return (
              <Button
                key={mbti}
                size="sm"
                variant={selected ? 'default' : 'outline'}
                className={cn('min-w-[22%]', selected && 'border-primary')}
                onPress={() => chooseMbti(mbti)}
              >
                <Text className={selected ? 'text-primary-foreground' : 'text-foreground'}>
                  {label}
                </Text>
              </Button>
            );
          })}
        </View>
      </View>

      <View className="gap-2 rounded-2xl bg-foreground p-5">
        <Text className="text-base font-extrabold text-background">거래 기록과 비교해 볼까요?</Text>
        <Text className="text-[13px] leading-5 text-background/75">
          응답한 자기 예상만 분석 결과에 나타납니다. 미응답 문항은 점수나 이용에 불이익이 없어요.
        </Text>
        <Button onPress={() => saveDiagnosis(profile)}>
          <Text>저장하고 거래내역 불러오기</Text>
        </Button>
        <Button variant="ghost" onPress={() => saveDiagnosis(profile)}>
          <Text className="text-background/75">나중에 답하기</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
